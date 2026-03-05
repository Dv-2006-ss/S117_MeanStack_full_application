import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
    message: string;
    type: ToastType;
}

export interface ModalConfig {
    title: string;
    message?: string;
    type: 'confirm' | 'prompt';
    defaultValue?: string;
}

@Injectable({
    providedIn: 'root'
})
export class ToastService {

    private toastSubject = new BehaviorSubject<Toast | null>(null);
    toast$ = this.toastSubject.asObservable();

    private modalSubject = new BehaviorSubject<{ config: ModalConfig, resolve: (val: any) => void } | null>(null);
    modal$ = this.modalSubject.asObservable();

    show(message: string, type: ToastType = 'success') {
        this.toastSubject.next({ message, type });

        setTimeout(() => {
            this.clear();
        }, 3000);
    }

    clear() {
        this.toastSubject.next(null);
    }

    confirm(title: string, message?: string): Promise<boolean> {
        return new Promise((resolve) => {
            this.modalSubject.next({ config: { title, message, type: 'confirm' }, resolve });
        });
    }

    prompt(title: string, defaultValue: string = ''): Promise<string | null> {
        return new Promise((resolve) => {
            this.modalSubject.next({ config: { title, type: 'prompt', defaultValue }, resolve });
        });
    }

    resolveModal(val: any) {
        let current = this.modalSubject.value;
        if (current) current.resolve(val);
        this.modalSubject.next(null);
    }
}