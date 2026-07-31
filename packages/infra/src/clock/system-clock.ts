import type { Clock } from "@plastlima-app/core";

export class SystemClock implements Clock {
	now(): Date {
		return new Date();
	}
}
