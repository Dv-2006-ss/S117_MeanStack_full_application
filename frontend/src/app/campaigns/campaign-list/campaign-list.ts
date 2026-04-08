import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { Campaign, CampaignService } from '../../core/services/campaign';

@Component({
  selector: 'app-campaign-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './campaign-list.html'
})
export class CampaignListComponent implements OnInit {
  campaigns: Campaign[] = [];
  isLoading = true;

  constructor(
    private readonly campaignService: CampaignService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.refresh();
  }

  refresh(): void {
    this.isLoading = true;
    this.campaignService.getCampaigns().subscribe({
      next: (campaigns) => {
        this.campaigns = campaigns;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  createCampaign(): void {
    this.router.navigate(['/app/campaigns/new']);
  }
}
