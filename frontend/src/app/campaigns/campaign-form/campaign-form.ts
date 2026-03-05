import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastService } from '../../core/services/toast';
import { CampaignService } from '../../core/services/campaign';
import { ScrollingModule } from '@angular/cdk/scrolling';

@Component({
  selector: 'app-campaign-form',
  standalone: true,
  imports: [CommonModule, FormsModule, ScrollingModule],
  templateUrl: './campaign-form.html',
  styleUrls: ['./campaign-form.css']
})
export class CampaignFormComponent implements OnInit {

  // ================= DATASET =================
  dataset: any = null;

  // ================= CAMPAIGN MODEL =================
  campaign: any = this.newCampaign();

  // ================= STATE =================
  sending = false;
  progress = 0;
  sentCount = 0;
  showTypeModal = false;
  showNameModal = false;
  showResendModal = false;
  showDeleteModal = false;
  deleteTargetIndex: number | null = null;
  resendTarget: any = null;
  campaignName = "";
  scheduledDate = "";

  // ================= LOGS STATE =================
  showLogsModal = false;
  selectedLogs: any[] = [];
  displayedLogs: any[] = [];
  targetCampaignName = "";
  successCount = 0;
  failedCount = 0;
  hasBothTypes = false;
  activeLogType = 'email';
  selectedCampaignTypes: string[] = [];

  searchText = '';
  ageFilter = 'all';

  campaignHistory: any[] = [];
  campaigns: any[] = [];
  filteredData: any[] = [];

  // ================= BUILDER BLOCKS =================
  blocks = [
    { type: 'text', label: 'Text Block' },
    { type: 'button', label: 'Button Block' },
    { type: 'divider', label: 'Divider' }
  ];

  // ================= NEW TEMPLATE FLOW (ADDED) =================
  templateBlocks: any[] = [];
  finalHtml = '';

  // ================= VIEW MODE =================
  mode: 'list' | 'create' | 'template' | 'editor' | 'preview' | 'analytics' = 'list';
  selectedCampaign: any = null;

  constructor(
    private router: Router,
    private toast: ToastService,
    private campaignService: CampaignService
  ) { }

  // ================= INIT =================
  ngOnInit() {

    const navState = history.state;

    this.dataset =
      navState?.dataset ||
      JSON.parse(localStorage.getItem('active_dataset') || 'null');

    if (navState?.campaign) {
      this.campaign = navState.campaign;
    }



    if (navState?.autoSend && !this.sending) {
      if (navState.scheduledDate) {
        this.scheduledDate = navState.scheduledDate;
      }
      // Clear the state IMMEDIATELY so duplicate Angular renderer lifecycle triggers don't pick this up
      history.replaceState({ ...navState, autoSend: false }, '');
      setTimeout(() => {
        this.sendCampaign(!!navState.scheduledDate);
      }, 300);
    } else if (navState?.autoUpdateOnly) {
      if (navState.scheduledDate) {
        this.scheduledDate = navState.scheduledDate;
      }
      history.replaceState({ ...navState, autoUpdateOnly: false }, '');
      setTimeout(() => {
        this.updateCampaignOnly(!!navState.scheduledDate);
      }, 300);
    }

    if (this.dataset) {
      localStorage.setItem('active_dataset', JSON.stringify(this.dataset));
      this.filteredData = [...(this.dataset.customers || [])];
    } else {
      this.filteredData = [];
    }

    // Load history from Backend API immediately
    this.fetchHistorySilently();

    // Setup an interval to auto-poll for real-time delivery Log counts updating
    setInterval(() => {
      this.fetchHistorySilently();
    }, 5000);

    const savedCampaigns = localStorage.getItem('campaign_list');
    this.campaigns = savedCampaigns ? JSON.parse(savedCampaigns) : [];

    this.applyFilters();
  }

  // ================= SILENT HISTORY POLL =================
  fetchHistorySilently() {
    this.campaignService.getHistory().subscribe({
      next: (res) => {
        this.campaignHistory = res;

        if (this.showLogsModal && this.targetCampaignName) {
          const active = this.campaignHistory.find((c: any) => c.name === this.targetCampaignName);
          if (active) {
            this.selectedLogs = active.deliveryLogs || [];
            this.selectedCampaignTypes = active.types || [active.type || 'email'];
            this.updateDisplayedLogs();
          }
        }
      },
      error: (err) => { console.log("silent poll err", err); } // Fail silently on interval background updates to prevent console spam
    });
  }

  // ================= NEW CAMPAIGN =================
  newCampaign() {
    return {
      id: null,
      name: '',
      subject: '',
      message: '',
      showNameModal: false,
      campaignName: "",
      type: 'email',
      scheduleTime: '',
      segmentRule: 'all',
      loop: false,
      loopDays: 0
    };
  }

  // ================= MODE SWITCH =================
  switchMode(m: any, campaign?: any) {
    this.mode = m;
    this.selectedCampaign = campaign || null;

    if (campaign)
      this.campaign = { ...campaign };
  }

  goBack() {
    this.router.navigate(['/customers']);
  }

  // ================= FILTER =================
  applyFilters() {

    if (!this.dataset?.customers) {
      this.filteredData = [];
      return;
    }

    this.filteredData =
      this.dataset.customers.filter((c: any) => {

        const matchSearch =
          !this.searchText ||
          c.name?.toLowerCase().includes(this.searchText.toLowerCase()) ||
          c.email?.toLowerCase().includes(this.searchText.toLowerCase());

        const matchAge =
          this.ageFilter === 'all' ||
          Number(c.age) >= Number(this.ageFilter);

        return matchSearch && matchAge;
      });
  }

  onFilterChange() {
    this.applyFilters();
  }

  // ================= VALIDATION =================
  validateAudience(list: any[]) {

    if (this.campaign.type === 'email') {
      return list.filter(u =>
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(u.email)
      );
    }

    if (this.campaign.type === 'sms') {
      return list.filter(u =>
        /^\d{10,15}$/.test(String(u.phone || ''))
      );
    }

    return list;
  }

  // ================= START CAMPAIGN =================
  startCampaign() {

    if (!this.filteredData.length) {
      this.toast.show("No recipients selected", "error");
      return;
    }

    this.showNameModal = true;
  }

  openCampaignNameModal() {
    if (!this.filteredData.length) {
      this.toast.show("No recipients selected", "error");
      return;
    }

    this.showNameModal = true;
  }

  // ================= NAME CONFIRM =================
  confirmCampaignName() {

    if (!this.campaignName || !this.campaignName.trim()) {
      this.toast.show("Enter campaign name", "error");
      return;
    }

    this.campaign.name = this.campaignName.trim();
    this.showNameModal = false;
    this.campaignName = "";
    this.showTypeModal = true;
  }

  // ================= TYPE SELECT (UPDATED ONLY EMAIL PART) =================
  selectCampaignType(type: 'email' | 'sms') {

    const existing = this.campaignHistory.find(h => h.name === this.campaign.name);
    if (existing) {
      const existingTypes = existing.types || [existing.type || 'email'];
      if (existingTypes.includes(type)) {
        this.toast.show(type === 'email' ? "Email campaign already created" : "SMS campaign already created", "error");
        return;
      }
    }

    this.campaign.type = type;
    this.showTypeModal = false;

    // NEW FLOW FOR EMAIL
    if (type === 'email') {
      this.router.navigate(['/email-builder'], { state: { dataset: this.dataset, campaign: this.campaign } });
      return;
    }

    // NEW FLOW FOR SMS
    if (type === 'sms') {
      this.router.navigate(['/sms-builder'], { state: { dataset: this.dataset, campaign: this.campaign } });
      return;
    }

    // fallback (should not reach here)
    this.sendCampaign();
  }

  // ================= TEMPLATE BUILDER =================
  addTemplateBlock(type: string) {

    if (type === 'text')
      this.templateBlocks.push({ type: 'text', content: '' });

    if (type === 'button')
      this.templateBlocks.push({ type: 'button', text: '', url: '' });

    if (type === 'divider')
      this.templateBlocks.push({ type: 'divider' });
  }

  removeTemplateBlock(i: number) {
    this.templateBlocks.splice(i, 1);
  }

  confirmTemplate() {

    if (!this.templateBlocks.length) {
      this.toast.show("Add at least one block", "error");
      return;
    }

    this.generateHTML();
    this.mode = 'editor';
  }

  generateHTML() {

    this.finalHtml = this.templateBlocks.map(block => {

      if (block.type === 'text')
        return `<p>${block.content}</p>`;

      if (block.type === 'button')
        return `
          <a href="${block.url}"
             style="display:inline-block;
                    padding:10px 20px;
                    background:#4CAF50;
                    color:#fff;
                    text-decoration:none;
                    border-radius:5px">
            ${block.text}
          </a>
        `;

      if (block.type === 'divider')
        return `<hr/>`;

      return '';

    }).join('');
  }

  confirmFinalEmail() {

    if (!this.finalHtml.trim()) {
      this.toast.show("Email content cannot be empty", "error");
      return;
    }

    this.campaign.message = this.finalHtml;
    this.mode = 'preview';
  }

  // ================= SAVE CAMPAIGN =================
  saveCampaign() {

    if (!this.campaign.name.trim()) {
      this.toast.show("Campaign name required", "error");
      return;
    }

    if (this.campaign.id) {

      const i =
        this.campaigns.findIndex(c => c.id === this.campaign.id);

      if (i > -1)
        this.campaigns[i] = { ...this.campaign };

    } else {

      this.campaign.id = Date.now();
      this.campaigns.push({ ...this.campaign });
    }

    localStorage.setItem(
      'campaign_list',
      JSON.stringify(this.campaigns)
    );

    this.resetForm();
    this.mode = 'list';
  }

  // ================= RESET =================
  resetForm() {
    this.campaign = this.newCampaign();
    this.campaignName = "";
    this.templateBlocks = [];
    this.finalHtml = '';
  }

  // ================= DELETE =================
  async deleteCampaign(id: number) {

    if (!(await this.toast.confirm("Are you sure you want to delete this campaign?"))) return;

    this.campaigns =
      this.campaigns.filter(c => c.id !== id);

    localStorage.setItem(
      'campaign_list',
      JSON.stringify(this.campaigns)
    );
  }

  // ================= SEND =================
  sendCampaign(isScheduled: boolean = false) {
    if (this.sending) return;
    this.sending = true; // Lock synchronously

    if (!this.campaign.message.trim()) {
      this.toast.show("Message cannot be empty", "error");
      this.sending = false;
      return;
    }

    let audience = this.filteredData;
    audience = this.validateAudience(audience);

    if (!audience.length) {
      this.toast.show("No valid recipients", "error");
      this.sending = false;
      return;
    }

    if (isScheduled) {
      if (!this.scheduledDate) {
        this.toast.show("Please select a date and time to schedule.", "error");
        this.sending = false;
        return;
      }
      this.finishCampaign(audience, true);
    } else {
      this.startSendFlow(audience);
    }
  }

  // ================= SEND FLOW =================
  startSendFlow(audience: any[]) {

    this.executeSend(audience);
  }

  // ================= EXECUTE =================
  executeSend(audience: any[]) {

    this.sentCount = 0;
    this.progress = 0;

    const total = audience.length;
    const chunkSize = Math.max(1, Math.ceil(total / 20));

    const interval = setInterval(() => {
      this.sentCount += chunkSize;
      if (this.sentCount > total) this.sentCount = total;

      this.progress = Math.floor((this.sentCount / total) * 100);

      if (this.sentCount >= total) {
        clearInterval(interval);
        this.finishCampaign(audience);
      }
    }, 30);
  }

  // ================= FINISH =================
  finishCampaign(audience: any[], isScheduled: boolean = false) {

    this.sending = false;

    const historyData: any = {
      name: this.campaign.name,
      subject: this.campaign.subject || this.campaign.name,
      message: this.campaign.message,
      type: this.campaign.type,
      types: [this.campaign.type],
      status: isScheduled ? 'Scheduled' : 'Complete',
      total: audience.length,
      date: new Date(),
      loop: this.campaign.loop,
      audience: audience // Pass down to the NodeJS server for NodeMailer and Textbelt SMS dispatch
    };

    if (isScheduled && this.scheduledDate) {
      historyData.scheduledDate = this.scheduledDate;
    }

    // 🚀 OPTIMISTIC UI UPDATE
    // Render the campaign instantly before the MongoDB response comes back
    this.campaignHistory.unshift(historyData);
    this.campaignHistory = [...this.campaignHistory];

    this.campaignService.saveHistory(historyData).subscribe({
      next: (res) => {
        if (res.success && res.history) {
          // Replace optimistic payload with real MongoDB Object containing _id
          const index = this.campaignHistory.indexOf(historyData);
          if (index > -1) {
            this.campaignHistory[index] = res.history;
          }
        }
      },
      error: (err) => {
        console.error("Failed to save history to backend", err);
      }
    });

    this.toast.show(isScheduled ? "Campaign Scheduled Successfully 🗓️" : "Campaign Sent Successfully 🚀", "success");
    this.mode = 'list';
    this.scheduledDate = "";
  }

  // ================= UPDATE ONLY =================
  updateCampaignOnly(isScheduled: boolean = false) {
    this.sending = true;

    const historyData: any = {
      name: this.campaign.name,
      subject: this.campaign.subject || this.campaign.name,
      message: this.campaign.message,
      type: this.campaign.type,
      types: [this.campaign.type],
      status: isScheduled ? 'Scheduled' : 'Draft',
      total: 0,
      date: new Date(),
      loop: this.campaign.loop,
      audience: [] // Empty audience means no execution
    };

    if (isScheduled && this.scheduledDate) {
      historyData.scheduledDate = this.scheduledDate;
    }

    this.campaignService.saveHistory(historyData).subscribe({
      next: (res) => {
        this.toast.show("Campaign template updated successfully.", "success");
        this.fetchHistorySilently();
        this.sending = false;
        this.mode = 'list';
      },
      error: (err) => {
        this.toast.show("Failed to update campaign", "error");
        this.sending = false;
      }
    });
  }

  // ================= CAMPAIGN HISTORY ACTIONS ================= //

  deleteHistory(index: number) {
    this.deleteTargetIndex = index;
    this.showDeleteModal = true;
  }

  confirmDeleteHistory() {
    if (this.deleteTargetIndex === null) return;

    const targetHistory = this.campaignHistory[this.deleteTargetIndex];

    if (targetHistory && targetHistory._id) {
      this.campaignService.deleteHistory(targetHistory._id).subscribe({
        next: () => {
          this.campaignHistory.splice(this.deleteTargetIndex!, 1);
          this.campaignHistory = [...this.campaignHistory]; // force angular refresh
          this.showDeleteModal = false;
          this.deleteTargetIndex = null;
          this.toast.show("History entry deleted", "info");
        },
        error: (err) => {
          console.error("Backend delete failed", err);
          this.toast.show("Failed to delete from server", "error");
        }
      });
    } else {
      // local slice if no _id
      this.campaignHistory.splice(this.deleteTargetIndex, 1);
      this.campaignHistory = [...this.campaignHistory]; // force angular refresh
      this.showDeleteModal = false;
      this.deleteTargetIndex = null;
      this.toast.show("History entry deleted", "info");
    }
  }

  resendCampaign(h: any) {
    if (this.isAddDisabled(h)) return;
    this.resendTarget = h;
    this.showResendModal = true;
  }

  confirmResendType(type: 'email' | 'sms') {
    const existingTypes = this.resendTarget.types || [this.resendTarget.type || 'email'];

    if (existingTypes.includes(type)) {
      this.toast.show(type === 'email' ? "Email campaign already created" : "SMS campaign already created", "error");
      return;
    }

    this.showResendModal = false;
    this.campaign.name = this.resendTarget.name;
    this.selectCampaignType(type);
  }

  getDisplayTypes(h: any): string {
    if (h.types && h.types.length > 0) {
      return h.types.join(', ').toUpperCase();
    }
    return (h.type || '').toUpperCase();
  }

  isAddDisabled(h: any): boolean {
    const existingTypes = h.types || [h.type || 'email'];
    return existingTypes.includes('email') && existingTypes.includes('sms');
  }

  editCampaignProtocol(h: any, type: string) {
    if (!this.dataset || !this.dataset.customers || this.dataset.customers.length === 0) {
      this.toast.show("A dataset must be selected to edit campaigns.", "info");
      return;
    }
    const editCampaign = { ...h, type: type, message: h.message || h.htmlContent };
    if (type === 'email') {
      this.router.navigate(['/email-builder'], { state: { dataset: this.dataset, campaign: editCampaign, isEdit: true } });
    } else {
      this.router.navigate(['/sms-builder'], { state: { dataset: this.dataset, campaign: editCampaign, isEdit: true } });
    }
  }

  // ================= DELIVERY LOGS ================= //
  viewLogs(h: any) {
    this.targetCampaignName = h.name;
    this.selectedLogs = h.deliveryLogs || [];
    this.selectedCampaignTypes = h.types || [h.type || 'email'];

    this.hasBothTypes = this.selectedCampaignTypes.includes('email') && this.selectedCampaignTypes.includes('sms');

    if (this.hasBothTypes) {
      if (!this.activeLogType) this.activeLogType = 'email';
    } else if (this.selectedCampaignTypes.includes('email')) {
      this.activeLogType = 'email';
    } else {
      this.activeLogType = 'sms';
    }

    this.updateDisplayedLogs();
    this.showLogsModal = true;
  }

  updateDisplayedLogs() {
    // Group logs
    const isEmail = (l: any) => {
      const targetStr = String(l.target || '');
      // Strict enough to pass real emails and fail random TextBelt SMS logs
      return targetStr.includes('@') && targetStr.indexOf('@') > 0 && targetStr.includes('.');
    };

    const emailLogs = this.selectedLogs.filter(l => isEmail(l));
    const smsLogs = this.selectedLogs.filter(l => !isEmail(l));

    // Rely on campaign configuration, NOT the presence of records which could be delayed:
    this.hasBothTypes = this.selectedCampaignTypes.includes('email') && this.selectedCampaignTypes.includes('sms');

    // Reset fallback
    if (!this.hasBothTypes) {
      if (emailLogs.length > 0) this.activeLogType = 'email';
      else if (smsLogs.length > 0) this.activeLogType = 'sms';
    }

    if (this.hasBothTypes) {
      this.displayedLogs = this.activeLogType === 'email' ? emailLogs : smsLogs;
    } else {
      this.displayedLogs = this.activeLogType === 'email' ? emailLogs : smsLogs;
    }

    this.successCount = this.displayedLogs.filter((l: any) => l.status === 'sent').length;
    this.failedCount = this.displayedLogs.filter((l: any) => l.status !== 'sent').length;
  }

  switchLogTab(type: string) {
    this.activeLogType = type;
    this.updateDisplayedLogs();
  }
}