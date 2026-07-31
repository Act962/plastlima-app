/**
 * Fonte de tempo injetável.
 *
 * Existe para o teste poder posicionar "agora" antes e depois do encerramento
 * das inscrições sem depender do relógio da máquina.
 */
export interface Clock {
	now(): Date;
}
