/**
 * Resultado explícito de uma operação que pode falhar.
 *
 * Usado no lugar de exceções nos casos de uso: o chamador é obrigado pelo
 * compilador a tratar a falha, e o teste afirma sobre um valor de retorno em vez
 * de depender de `expect(...).rejects`.
 */
export type Result<T, E> =
	| { readonly ok: true; readonly value: T }
	| { readonly ok: false; readonly error: E };

export function ok<T>(value: T): Result<T, never> {
	return { ok: true, value };
}

export function fail<E>(error: E): Result<never, E> {
	return { ok: false, error };
}
