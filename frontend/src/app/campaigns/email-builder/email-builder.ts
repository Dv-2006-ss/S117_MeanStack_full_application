import { Component, OnInit, signal, effect, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ToastService } from '../../core/services/toast';
import { CampaignService } from '../../core/services/campaign';

@Component({
    selector: 'app-email-builder',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './email-builder.html',
    styleUrls: ['./email-builder.css']
})
export class EmailBuilderComponent implements OnInit {

    dataset: any = null;
    campaign: any = null;
    finalHtml: SafeHtml | string = '';
    isDirectAccess = false;
    startedAsEdit = false;
    companyName = 'Company';
    isSaving = false;
    scheduledDateStr = '';
    scheduledTimeStr = '';
    scheduleMode: 'immediate' | 'later' = 'immediate';
    userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    scheduledDate = '';

    get blocks() { return this.campaignService.emailBlocks(); }
    get subjectLine() { return this.campaignService.emailSubject(); }
    set subjectLine(val: string) { this.campaignService.emailSubject.set(val); }

    constructor(
        private router: Router,
        private toast: ToastService,
        public campaignService: CampaignService,
        private sanitizer: DomSanitizer
    ) {
        // Track state natively with signals for real-time reactivity
        effect(() => {
            // Read signal dependency
            this.campaignService.emailBlocks();
            // We use untracked so the finalHtml update itself doesn't cause recursive triggers
            this.generateHTML();
        });
    }

    ngOnInit() {
        const currentUser = JSON.parse(localStorage.getItem('user') || localStorage.getItem('currentUser') || '{}');
        this.companyName = currentUser.companyName || 'Company';

        const navState = history.state;

        if (!navState || !navState.campaign) {
            this.isDirectAccess = true;
        }

        this.dataset = navState?.dataset || JSON.parse(localStorage.getItem('active_dataset') || 'null');
        this.campaign = navState?.campaign || { name: 'New Email Campaign', type: 'email' };

        // Init signal state
        this.campaignService.emailSubject.set(this.campaign.subject || this.campaign.name || 'New Email Campaign');

        if (!this.dataset || !this.campaign) {
            this.router.navigate(['/campaigns-form']);
            return;
        }

        if (navState?.isEdit) {
            this.startedAsEdit = true;
            if (this.campaign.template && this.campaign.template.blocks && this.campaign.template.blocks.length > 0) {
                // We have blocks! Use the sleek studio builder.
                this.campaignService.emailBlocks.set(this.campaign.template.blocks);
            } else if (this.campaign.message) {
                // Parse legacy HTML back into a simple, beautiful text block
                let htmlStr = this.campaign.message;
                htmlStr = htmlStr.replace(/<br\s*\/?>/gi, '\n');
                htmlStr = htmlStr.replace(/<\/p>/gi, '\n');
                htmlStr = htmlStr.replace(/<\/div>/gi, '\n');

                const tmp = document.createElement('div');
                tmp.innerHTML = htmlStr;
                let cleanText = tmp.textContent || '';

                // Clean standard footers
                cleanText = cleanText.replace(/Sent by[\s\S]*?click here\./i, '').trim();
                cleanText = cleanText.replace(/© \d{4} All rights reserved\./i, '').trim();
                cleanText = cleanText.replace(/Company/g, '').trim();

                this.campaignService.emailBlocks.set([{ type: 'text', content: cleanText }]);
            } else {
                this.campaignService.emailBlocks.set([]);
            }
            this.generateHTML();
        } else {
            // Signal defaults
            this.campaignService.emailBlocks.set([]);
            this.generateHTML();
        }
    }

    goBack() {
        if (this.isDirectAccess) {
            this.router.navigate(['/']);
        } else {
            this.router.navigate(['/campaigns-form']);
        }
    }

    addTemplateBlock(type: string) {
        const blocks = this.campaignService.emailBlocks();
        if (type === 'text') blocks.push({ type: 'text', content: '' });
        if (type === 'button') blocks.push({ type: 'button', text: 'Click Here', url: 'https://' });
        if (type === 'divider') blocks.push({ type: 'divider' });
        if (type === 'image') blocks.push({ type: 'image', url: '' });
        this.campaignService.emailBlocks.set([...blocks]);
    }

    removeTemplateBlock(i: number) {
        const blocks = this.campaignService.emailBlocks();
        blocks.splice(i, 1);
        this.campaignService.emailBlocks.set([...blocks]);
    }

    updatePreview() {
        this.campaignService.emailBlocks.set([...this.campaignService.emailBlocks()]);
    }

    generateHTML() {
        const blocks = this.campaignService.emailBlocks();
        const htmlString = `
      <div style="font-family: 'Inter', sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background: #fff; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
        ${blocks.map(block => {
            if (block.type === 'text') return `<p style="line-height: 1.6; font-size: 16px; color: #4b5563;">${block.content || 'Start typing...'}</p>`;
            if (block.type === 'button') return `
            <div style="text-align: center; margin: 25px 0;">
              <a href="${block.url}" style="display: inline-block; padding: 12px 28px; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: #fff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 10px rgba(99, 102, 241, 0.3);">
                ${block.text || 'Button'}
              </a>
            </div>
          `;
            if (block.type === 'divider') return `<hr style="border: 0; height: 1px; background: #e5e7eb; margin: 30px 0;"/>`;
            if (block.type === 'image') return `<div style="text-align: center; margin: 20px 0;">${block.url ? `<img src="${block.url}" alt="Image" style="max-width: 100%; border-radius: 8px;" onerror="this.style.display='none'" />` : `<div style="padding:40px; background:#f3f4f6; border-radius:8px; color:#9ca3af; font-size:14px; border:2px dashed #d1d5db;">Placeholder Image</div>`}</div>`;
            return '';
        }).join('')}

        <div style="margin-top: 40px; padding-top: 25px; border-top: 1px solid #e5e7eb; text-align: center;">
            <p style="color: #6b7280; font-size: 14px; margin: 0; font-weight: 500;">Sent by <strong style="color: #4f46e5;">${this.companyName}</strong></p>
            <p style="color: #9ca3af; font-size: 12px; margin-top: 8px;">&copy; ${new Date().getFullYear()} All rights reserved.</p>
            <p style="color: #9ca3af; font-size: 11px; margin-top: 6px;">To unsubscribe from these emails, <a href="#" style="color: #6b7280; text-decoration: underline;">click here</a>.</p>
        </div>
      </div>
    `;
        this.finalHtml = this.sanitizer.bypassSecurityTrustHtml(htmlString);
    }

    confirmFinalEmail() {
        if (this.isDirectAccess) {
            this.toast.show("Action restricted.", "error");
            return;
        }

        const blocks = this.campaignService.emailBlocks();
        if (!blocks.length) {
            this.toast.show("Add blocks to generate an email template first.", "error"); return;
        }

        this.isSaving = true;

        if (this.scheduleMode === 'later') {
            if (!this.scheduledDateStr || !this.scheduledTimeStr) {
                this.toast.show("Please select both a date and time to schedule this campaign.", "error");
                this.isSaving = false;
                return;
            }
            this.scheduledDate = `${this.scheduledDateStr}T${this.scheduledTimeStr}`;
        } else {
            this.scheduledDate = '';
        }

        const payload = {
            name: this.campaign.name,
            subject: this.campaignService.emailSubject(),
            product: this.campaign.product || 'Automation Product',
            offer: this.campaign.offer || 'Default Offer',
            blocks: blocks
        };

        // Using Backend Integration properly
        this.campaignService.createEmailCampaign(payload).subscribe({
            next: (res) => {
                this.isSaving = false;
                this.toast.show(this.startedAsEdit ? "Campaign updated successfully." : "Email generated successfully.", "success");
                this.campaign.message = res.campaign.htmlContent;
                this.campaign.id = res.campaign._id;

                const navState: any = { dataset: this.dataset, campaign: this.campaign, scheduledDate: this.scheduledDate };
                if (this.startedAsEdit) {
                    navState.autoUpdateOnly = true;
                } else {
                    navState.autoSend = true;
                }

                this.router.navigate(['/campaigns-form'], { state: navState });
            },
            error: (err) => {
                this.isSaving = false;
                this.toast.show("Failed to create/update email via Node.js backend.", "error");
            }
        });
    }

    async deleteCampaign() {
        if (!this.campaign || !this.campaign._id) return;
        if (await this.toast.confirm("Are you sure you want to completely delete this campaign?")) {
            this.campaignService.deleteHistory(this.campaign._id).subscribe({
                next: () => {
                    this.toast.show("Campaign deleted.", "info");
                    this.router.navigate(['/campaigns-form']);
                },
                error: () => this.toast.show("Failed to delete campaign.", "error")
            });
        }
    }
}
