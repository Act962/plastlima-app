"use client";

import {
	closestCenter,
	DndContext,
	type DragEndEvent,
	KeyboardSensor,
	PointerSensor,
	useSensor,
	useSensors,
} from "@dnd-kit/core";
import {
	restrictToParentElement,
	restrictToVerticalAxis,
} from "@dnd-kit/modifiers";
import {
	SortableContext,
	sortableKeyboardCoordinates,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import type { ReactNode } from "react";
import { useRef } from "react";

/**
 * Ids estáveis por identidade do objeto.
 *
 * Reordenar preserva a referência de cada item (o `arrayMove` só embaralha),
 * então o id acompanha o item; ao editar, o objeto é trocado e ganha um id novo
 * — sem efeito na ordenação. Um `WeakMap` porque item removido não deve
 * continuar ocupando memória só por causa do id.
 */
export function useStableIds<T extends object>(prefix: string) {
	const ids = useRef(new WeakMap<T, string>());
	const seq = useRef(0);

	return function idOf(item: T): string {
		let id = ids.current.get(item);
		if (id === undefined) {
			seq.current += 1;
			id = `${prefix}-${seq.current}`;
			ids.current.set(item, id);
		}
		return id;
	};
}

type Props = {
	/** Ids na ordem atual — a mesma ordem dos filhos. */
	ids: string[];
	/** Chamado com os índices de origem e destino do item arrastado. */
	onReorder: (from: number, to: number) => void;
	children: ReactNode;
};

/**
 * Lista vertical reordenável por arrasto — a plumbing do dnd-kit que as seções
 * do editor da home compartilham. Cada linha cuida do próprio `useSortable`.
 */
export function SortableList({ ids, onReorder, children }: Props) {
	const sensors = useSensors(
		// Exige mover 6px antes de arrastar, senão um clique em "Editar" viraria
		// um arrasto.
		useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		}),
	);

	function handleDragEnd(event: DragEndEvent) {
		const { active, over } = event;
		if (over === null || active.id === over.id) {
			return;
		}

		const from = ids.indexOf(String(active.id));
		const to = ids.indexOf(String(over.id));
		if (from === -1 || to === -1) {
			return;
		}

		onReorder(from, to);
	}

	return (
		<DndContext
			collisionDetection={closestCenter}
			modifiers={[restrictToVerticalAxis, restrictToParentElement]}
			onDragEnd={handleDragEnd}
			sensors={sensors}
		>
			<SortableContext items={ids} strategy={verticalListSortingStrategy}>
				<ul className="flex flex-col gap-2.5">{children}</ul>
			</SortableContext>
		</DndContext>
	);
}
