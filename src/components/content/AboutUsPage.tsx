/**
 * ?????? - ??????
 * ??????? - ??Tesla?Airbnb??????
 * ?????????????????API??
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Building,
  Users,
  Award,
  TrendingUp,
  Globe,
  Heart,
  Zap,
  Shield
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { apiClient } from '@/services/apiClient';
import { sanitizeHTMLForReact } from '@/utils/sanitize';

interface AboutContent {
  _id: string;
  title: string;
  summary: string;
  content?: any;
  sections?: any[];
  thumbnail?: string;
}

const AboutUsPage: React.FC = () => {
  const { t } = useTranslation();
  const [aboutData, setAboutData] = useState<AboutContent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAboutData();
  }, []);

  const loadAboutData = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/v1/content/about', {
        params: {
          status: 'published',
          limit: 1
        }
      });

      if (response.data?.success && response.data.data?.length > 0) {
        setAboutData(response.data.data[0]);
      }
    } catch (error) {
      console.error('????????:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Hero Banner - ???? */}
      <section className="relative h-[60vh] min-h-[500px] bg-gradient-to-br from-blue-600 via-blue-700 to-purple-800 overflow-hidden">
        <div className="absolute inset-0 bg-black/30" />
        <div className="absolute inset-0 bg-[url('/images/pattern.svg')] opacity-10" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center">
          <div className="max-w-3xl text-white">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
              {aboutData?.title || t('aboutPage.defaultTitle')}
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 leading-relaxed">
              {aboutData?.summary || t('aboutPage.defaultSubtitle')}
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Button
                size="lg"
                className="bg-white text-blue-600 hover:bg-gray-100"
                onClick={() => window.location.href = '/contact'}
              >
                {t('aboutPage.contactUs')}
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white/10"
                onClick={() => document.getElementById('company-info')?.scrollIntoView({ behavior: 'smooth' })}
              >
                {t('aboutPage.learnMore')}
              </Button>
            </div>
          </div>
        </div>

        {/* ??????*/}
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-white dark:from-gray-900 to-transparent" />
      </section>

      {/* ????? */}
      <section className="py-20 bg-white dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              {t('aboutPage.coreValuesTitle')}
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              {t('aboutPage.coreValuesSubtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: Heart,
                title: t('aboutPage.customerFirst'),
                description: t('aboutPage.customerFirstDesc'),
                color: 'text-red-600'
              },
              {
                icon: Zap,
                title: t('aboutPage.innovation'),
                description: t('aboutPage.innovationDesc'),
                color: 'text-yellow-600'
              },
              {
                icon: Shield,
                title: t('aboutPage.quality'),
                description: t('aboutPage.qualityDesc'),
                color: 'text-green-600'
              }
            ].map((value, idx) => (
              <Card key={idx} className="text-center group hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                <CardContent className="p-8">
                  <div className={`inline-flex items-center justify-center w-16 h-16 ${value.color} bg-gray-100 dark:bg-gray-800 rounded-2xl mb-6 group-hover:scale-110 transition-transform`}>
                    <value.icon className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                    {value.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                    {value.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ???? */}
      <section className="py-20 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-900" id="company-info">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { number: '10+', label: t('aboutPage.yearsExperience'), icon: TrendingUp },
              { number: '500+', label: t('aboutPage.clients'), icon: Users },
              { number: '1000+', label: t('aboutPage.successCases'), icon: Award },
              { number: '50+', label: t('aboutPage.teamMembers'), icon: Globe }
            ].map((stat, idx) => (
              <div key={idx} className="text-center group">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl mb-4 group-hover:scale-110 transition-transform">
                  <stat.icon className="w-6 h-6 text-blue-600" />
                </div>
                <div className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                  {stat.number}
                </div>
                <div className="text-gray-600 dark:text-gray-400">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ???? - ?????????? */}
      {aboutData?.sections && aboutData.sections.length > 0 && (
        <section className="py-20 bg-white dark:bg-slate-950">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                {t('aboutPage.milestoneTitle')}
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400">
                {t('aboutPage.milestoneSubtitle')}
              </p>
            </div>

            <div className="relative">
              {/* ????*/}
              <div className="hidden md:block absolute left-1/2 transform -translate-x-1/2 h-full w-1 bg-gradient-to-b from-blue-600 via-purple-600 to-blue-600" />

              <div className="space-y-12">
                {aboutData.sections.map((milestone: any, idx: number) => {
                  // ????????
                  const year = milestone.year || milestone.heading || milestone.title;
                  const title = milestone.title || milestone.subtitle || milestone.heading;
                  const description = milestone.description || milestone.content || milestone.summary;

                  return (
                    <div key={milestone.id || idx} className={`flex items-center ${idx % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'}`}>
                      <div className={`flex-1 ${idx % 2 === 0 ? 'md:text-right md:pr-12' : 'md:pl-12'}`}>
                        <Card className="inline-block hover:shadow-xl transition-shadow">
                          <CardContent className="p-6">
                            {year && (
                              <div className="text-2xl font-bold text-blue-600 mb-2">{year}</div>
                            )}
                            {title && (
                              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                                {title}
                              </h3>
                            )}
                            {description && (
                              <div
                                className="text-gray-600 dark:text-gray-400"
                                dangerouslySetInnerHTML={sanitizeHTMLForReact(description)}
                              />
                            )}
                          </CardContent>
                        </Card>
                      </div>

                      {/* ????*/}
                      <div className="hidden md:block relative z-10">
                        <div className="w-4 h-4 bg-blue-600 rounded-full border-4 border-white dark:border-gray-900 shadow-lg" />
                      </div>

                      <div className="flex-1" />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ???? CTA */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
          <Building className="w-16 h-16 mx-auto mb-6" />
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            {t('aboutPage.ctaTitle')}
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            {t('aboutPage.ctaSubtitle')}
          </p>

          <Button
            size="lg"
            className="bg-white text-blue-600 hover:bg-gray-100"
            onClick={() => window.location.href = '/contact'}
          >
            {t('aboutPage.contactNow')}
          </Button>
        </div>
      </section>

      {/* ??????????????*/}
      {!aboutData && !loading && (
        <section className="py-20 text-center">
          <Building className="w-20 h-20 mx-auto mb-4 text-gray-400 opacity-50" />
          <p className="text-xl text-gray-600 dark:text-gray-400">
            {t('pages.aboutUnderConstruction')}
          </p>
        </section>
      )}
    </div>
  );
};

export default AboutUsPage;

