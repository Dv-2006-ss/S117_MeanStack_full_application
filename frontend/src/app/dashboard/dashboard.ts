import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { AuthService } from '../auth/auth.service';
import { CampaignOverview, CampaignService } from '../core/services/campaign';
import { CinematicFooterComponent } from '../components/ui/cinematic-footer/cinematic-footer.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, CinematicFooterComponent],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.scss']
})
export class DashboardComponent implements OnInit {
  userName = 'there';
  companyName = 'your business';
  loading = true;
  showBackToTop = false;

  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.showBackToTop = window.scrollY > 300;
  }

  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  overview: CampaignOverview = {
    totalCampaigns: 0,
    draftCount: 0,
    scheduledCount: 0,
    sentCount: 0,
    audienceReached: 0,
    activeDatasets: 0,
    nextRecommendedAction: 'Import a customer dataset to start your first campaign',
    recentCampaigns: []
  };

  readonly quickActions = [
    {
      label: 'New campaign',
      copy: 'Create a fresh campaign brief and generate multi-channel outputs.',
      action: 'campaign'
    },
    {
      label: 'Import audience',
      copy: 'Upload or select a dataset before building your next campaign.',
      action: 'audience'
    },
    {
      label: 'Update brand profile',
      copy: 'Keep your offer, voice, and preferred channels aligned in settings.',
      action: 'settings'
    }
  ];

  constructor(
    private readonly auth: AuthService,
    private readonly campaignService: CampaignService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    const user = this.auth.getCurrentUser();
    if (user) {
      this.userName = user.name.split(' ')[0];
      this.companyName = user.companyName || this.companyName;
    }

    this.campaignService.getOverview().subscribe({
      next: (response) => {
        this.overview = response.overview || this.overview;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  handleAction(action: string): void {
    if (action === 'campaign') {
      this.router.navigate(['/app/campaigns/new']);
      return;
    }

    if (action === 'audience') {
      this.router.navigate(['/app/customers']);
      return;
    }

    this.router.navigate(['/app/settings']);
  }
}
