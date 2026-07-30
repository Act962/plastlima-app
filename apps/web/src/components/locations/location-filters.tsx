import { cn } from "@plastlima-app/ui/lib/utils";
import { STATE_FILTERS, type StateFilter } from "@/lib/locations";

type LocationFiltersProps = {
	activeState: StateFilter;
	search: string;
	onStateChange: (state: StateFilter) => void;
	onSearchChange: (search: string) => void;
};

export function LocationFilters({
	activeState,
	search,
	onStateChange,
	onSearchChange,
}: LocationFiltersProps) {
	return (
		<div className="mb-9 flex flex-wrap items-center gap-4 border-line border-b pb-7">
			<div className="flex flex-wrap gap-2">
				{STATE_FILTERS.map((state) => (
					<button
						aria-pressed={state === activeState}
						className={cn(
							"cursor-pointer rounded-full border-[1.5px] bg-surface px-[18px] py-2.5 font-bold text-sm transition-colors",
							state === activeState
								? "border-ink text-ink"
								: "border-line-strong text-body hover:border-ink hover:text-ink",
						)}
						key={state}
						onClick={() => onStateChange(state)}
						type="button"
					>
						{state}
						{state === activeState ? (
							<span
								aria-hidden="true"
								className="ml-2 inline-block size-1.5 rounded-full bg-brand align-middle"
							/>
						) : null}
					</button>
				))}
			</div>

			<input
				aria-label="Buscar por cidade ou loja"
				className="ml-auto min-w-[240px] flex-1 rounded-full border-[1.5px] border-line bg-surface px-[18px] py-3 text-[14.5px] outline-none focus:border-brand"
				onChange={(event) => onSearchChange(event.target.value)}
				placeholder="Buscar por cidade ou loja…"
				type="search"
				value={search}
			/>
		</div>
	);
}
