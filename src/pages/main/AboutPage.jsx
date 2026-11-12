import React from 'react';

import AboutCtaComponent from '@/components/about/AboutCtaComponent';
import AboutHeroComponent from '@/components/about/AboutHeroComponent';
import AboutHowItWorksComponent from '@/components/about/AboutHowItWorksComponent';
import AboutStatsComponent from '@/components/about/AboutStatsComponent';
import AboutStoryComponent from '@/components/about/AboutStoryComponent';
import AboutTimelineComponent from '@/components/about/AboutTimelineComponent';
import AboutTrustComponent from '@/components/about/AboutTrustComponent';
import WhyChoseUsComponent from '@/components/about/WhyChoseUsComponent';


/*
 * صفحه‌ی «درباره ما» — بازطراحی حرفه‌ای:
 * بنر + آمار + داستان و ماموریت + مزیت‌ها + فرایند کار + مسیر زمانی + تضمین‌ها + فراخوان
 */
function AboutPage() {
  return (
    <div className="pb-4">
      <AboutHeroComponent />
      <AboutStatsComponent />
      <AboutStoryComponent />
      <WhyChoseUsComponent />
      <AboutHowItWorksComponent />
      <AboutTimelineComponent />
      <AboutTrustComponent />
      <AboutCtaComponent />
    </div>
  );
}

export default AboutPage;
