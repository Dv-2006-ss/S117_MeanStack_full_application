import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastService } from '../../core/services/toast';
import { CampaignService } from '../../core/services/campaign';

@Component({
    selector: 'app-sms-builder',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './sms-builder.html',
    styleUrls: ['./sms-builder.css']
})
export class SmsBuilderComponent implements OnInit {

    dataset: any = null;
    campaign: any = null;
    smsContent = '';
    isDirectAccess = false;
    isEditMode = false;
    companyName = 'Company';
    scheduledDateStr = '';
    scheduledTimeStr = '';
    scheduleMode: 'immediate' | 'later' = 'immediate';
    userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    scheduledDate = '';

    constructor(private router: Router, private toast: ToastService, private campaignService: CampaignService) { }

    ngOnInit() {
        const currentUser = JSON.parse(localStorage.getItem('user') || localStorage.getItem('currentUser') || '{}');
        this.companyName = currentUser.companyName || 'Company';

        const navState = history.state;

        if (!navState || !navState.campaign) {
            this.isDirectAccess = true;
        }

        this.dataset = navState?.dataset || JSON.parse(localStorage.getItem('active_dataset') || 'null');
        this.campaign = navState?.campaign || { name: 'New SMS Campaign', type: 'sms' };

        if (!this.dataset || !this.campaign) {
            this.router.navigate(['/campaigns-form']);
            return;
        }

        if (navState?.isEdit) {
            this.isEditMode = true;
            let cleanMessage = this.campaign.message || '';
            cleanMessage = cleanMessage.replace(/<[^>]*>?/gm, '').replace(/undefined/g, '').trim();
            this.smsContent = cleanMessage;
        }
    }

    goBack() {
        if (this.isDirectAccess) {
            this.router.navigate(['/']);
        } else {
            this.router.navigate(['/campaigns-form']);
        }
    }

    insertVariable(variable: string) {
        this.smsContent += variable;
    }

    async insertLink() {
        const url = await this.toast.prompt("Enter the URL to link:", "https://yourwebsite.com/offer");
        if (url) {
            this.smsContent += ` ${url} `;
        }
    }

    insertOptOut() {
        this.smsContent += "\n\nReply STOP to opt out.";
    }

    confirmFinalSms() {
        if (this.isDirectAccess) {
            this.toast.show("Action restricted: Please start a campaign from the Campaign Engine page first, rather than the sidebar.", "error");
            return;
        }
        if (!this.smsContent.trim()) {
            this.toast.show("SMS content cannot be empty.", "error");
            return;
        }
        this.campaign.message = this.smsContent;

        if (this.scheduleMode === 'later') {
            if (!this.scheduledDateStr || !this.scheduledTimeStr) {
                this.toast.show("Please select both a date and time to schedule this campaign.", "error");
                return;
            }
            this.scheduledDate = `${this.scheduledDateStr}T${this.scheduledTimeStr}`;
        } else {
            this.scheduledDate = '';
        }

        // Redirect back to standard form
        const navState: any = { dataset: this.dataset, campaign: this.campaign, scheduledDate: this.scheduledDate };
        if (this.isEditMode) navState.autoUpdateOnly = true;
        else navState.autoSend = true;

        this.router.navigate(['/campaigns-form'], { state: navState });
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
