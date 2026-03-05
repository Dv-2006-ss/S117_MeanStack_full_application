import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, Toast } from '../core/services/toast';

@Component({
  selector: 'app-global-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="toastService.toast$ | async as toast"
         class="pro-toast {{ toast.type }}">

      <div class="toast-icon">
        {{ toast.type === 'success' ? '✔' :
           toast.type === 'error' ? '⚠' : 'ℹ' }}
      </div>

      <div class="toast-text">
        {{ toast.message }}
      </div>
    </div>

    <!-- GLOBAL STITCH MODAL -->
    <div *ngIf="toastService.modal$ | async as modal" class="pro-overlay">
      <div class="pro-window w-sm">
        <div class="pro-titlebar">
          <h3>{{ modal.config.title }}</h3>
          <button class="btn-close" (click)="toastService.resolveModal(modal.config.type === 'prompt' ? null : false)">
            <span class="material-symbols-outlined material-icon">close</span>
          </button>
        </div>
        <div class="pro-content">
          <p class="warning-text" style="color: white; margin-top: 0;" *ngIf="modal.config.message">{{ modal.config.message }}</p>
          
          <div class="input-group" [style.display]="modal.config.type === 'prompt' ? 'block' : 'none'">
            <input type="text" #promptInput [value]="modal.config.defaultValue || ''" (keyup.enter)="toastService.resolveModal(promptInput.value)" class="stitch-input" style="width: 100%; border:1px solid rgba(255,255,255,0.1); padding: 0.8rem; border-radius:8px; background:rgba(0,0,0,0.3); color:white;"/>
          </div>

          <div class="pro-actions" style="margin-top:1rem; display:flex; gap:1rem;">
            <button class="btn-secondary" style="flex:1" (click)="toastService.resolveModal(modal.config.type === 'prompt' ? null : false)">Cancel</button>
            <button class="btn-primary highlight neon-glow" style="flex:1" (click)="toastService.resolveModal(modal.config.type === 'prompt' ? promptInput.value : true)">Confirm</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./global-toast.css']
})
export class GlobalToastComponent {

  constructor(public toastService: ToastService) { }
}