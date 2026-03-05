import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class CampaignEngine {

  private campaigns: any[] = [];
  private timers: Map<number, any> = new Map();

  constructor() {
    this.campaigns = this.load();
  }

  // ======================
  // STORAGE
  // ======================

  save() {
    localStorage.setItem(
      'campaign_engine',
      JSON.stringify(this.campaigns)
    );
  }

  load(): any[] {
    return JSON.parse(
      localStorage.getItem('campaign_engine') || '[]'
    );
  }

  // ======================
  // CREATE
  // ======================

  create(dataset: any) {

    const campaign = {

      id: Date.now(),
      title: `Campaign — ${dataset.name}`,

      dataset: dataset.name,

      status: "Draft",

      delivered: 0,
      total: dataset.customers.length,

      progress: 0,
      log: [],

      scheduledAt: null,
      created: new Date()
    };

    this.campaigns.push(campaign);
    this.save();

    return campaign;
  }

  // ======================
  // START
  // ======================

  start(id: number) {

    const c = this.campaigns.find(x => x.id === id);
    if (!c) return;

    c.status = "Running";

    const chunkSize = Math.max(1, Math.ceil(c.total / 10));

    const timer = setInterval(() => {
      if (c.delivered < c.total) {
        c.delivered += chunkSize;
        if (c.delivered > c.total) c.delivered = c.total;
      }

      c.progress = Math.min(100, Math.floor((c.delivered / c.total) * 100));

      c.log.push({
        time: new Date(),
        msg: `Delivered ${c.delivered}`
      });

      if (c.delivered >= c.total) {
        c.status = "Completed";
        clearInterval(timer);
        this.timers.delete(id);
      }
      this.save();
    }, 50);

    this.timers.set(id, timer);
    this.save();
  }

  // ======================
  // CONTROLS
  // ======================

  pause(id: number) {

    const c = this.campaigns.find(x => x.id === id);
    if (!c) return;

    c.status = "Paused";
    this.save();
  }

  resume(id: number) {

    const c = this.campaigns.find(x => x.id === id);
    if (!c) return;

    this.start(id);
  }

  cancel(id: number) {

    const c = this.campaigns.find(x => x.id === id);
    if (!c) return;

    c.status = "Cancelled";

    const timer = this.timers.get(id);
    if (timer) clearInterval(timer);

    this.save();
  }

  // ======================
  // SCHEDULER
  // ======================

  schedule(id: number, date: Date) {

    const c = this.campaigns.find(x => x.id === id);
    if (!c) return;

    c.status = "Scheduled";
    c.scheduledAt = date;

    const delay =
      new Date(date).getTime() - Date.now();

    setTimeout(() => this.start(id), delay);

    this.save();
  }

  // ======================

  getAll() {
    return this.campaigns;
  }

}
