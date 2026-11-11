import React from 'react';
import AboutUsComponent from '../../components/main/AboutUsComponent';
import WhyChoseUsComponent from '../../components/main/WhyChoseUsComponent';

function AboutPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <AboutUsComponent />
      <WhyChoseUsComponent />
    </div>
  );
}

export default AboutPage;
