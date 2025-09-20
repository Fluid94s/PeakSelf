import React from 'react';
import { Users, Target, Lightbulb, Heart } from 'lucide-react';

const About = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            About PeakSelf
          </h1>
          <p className="text-xl text-blue-100 leading-relaxed">
            We're passionate about sharing knowledge, insights, and experiences 
            that help individuals and communities reach their peak potential.
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              Our Mission
            </h2>
            <p className="text-xl text-gray-600 leading-relaxed">
              To create a platform where knowledge meets inspiration, and where 
              every reader can discover tools, insights, and stories that propel 
              them toward their personal and professional goals.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lightbulb className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Inspire</h3>
              <p className="text-gray-600">
                Share stories and insights that spark new ideas and motivate positive change.
              </p>
            </div>
            
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Educate</h3>
              <p className="text-gray-600">
                Provide practical knowledge and actionable advice across diverse topics.
              </p>
            </div>
            
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Connect</h3>
              <p className="text-gray-600">
                Build a community of learners, creators, and growth-minded individuals.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Our Story
              </h2>
              <div className="space-y-4 text-gray-600 leading-relaxed">
                <p>
                  PeakSelf was born from a simple belief: everyone has the potential 
                  to achieve extraordinary things when they have access to the right 
                  knowledge, tools, and inspiration.
                </p>
                <p>
                  What started as a personal blog sharing insights about technology 
                  and personal development has evolved into a comprehensive platform 
                  that serves thousands of readers worldwide.
                </p>
                <p>
                  Today, we're proud to feature content from expert writers, industry 
                  leaders, and passionate individuals who share our commitment to 
                  continuous learning and growth.
                </p>
              </div>
            </div>
            
            <div className="bg-white p-8 rounded-lg shadow-lg">
              <div className="grid grid-cols-2 gap-6 text-center">
                <div>
                  <div className="text-3xl font-bold text-blue-600 mb-2">50+</div>
                  <div className="text-gray-600">Articles Published</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-green-600 mb-2">10K+</div>
                  <div className="text-gray-600">Monthly Readers</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-purple-600 mb-2">25+</div>
                  <div className="text-gray-600">Expert Contributors</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-orange-600 mb-2">4</div>
                  <div className="text-gray-600">Content Categories</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              Our Values
            </h2>
            <p className="text-xl text-gray-600">
              The principles that guide everything we do
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="p-6 border-l-4 border-blue-500">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Quality First</h3>
              <p className="text-gray-600">
                We believe in delivering high-quality, well-researched content that 
                provides real value to our readers.
              </p>
            </div>
            
            <div className="p-6 border-l-4 border-green-500">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Authenticity</h3>
              <p className="text-gray-600">
                Our content comes from real experiences, genuine insights, and 
                authentic voices from our community.
              </p>
            </div>
            
            <div className="p-6 border-l-4 border-purple-500">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Inclusivity</h3>
              <p className="text-gray-600">
                We welcome diverse perspectives and strive to create content that 
                resonates with people from all walks of life.
              </p>
            </div>
            
            <div className="p-6 border-l-4 border-orange-500">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Growth Mindset</h3>
              <p className="text-gray-600">
                We're committed to continuous improvement, both in our content 
                and in supporting our readers' growth journeys.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              Meet Our Team
            </h2>
            <p className="text-xl text-gray-600">
              The passionate individuals behind PeakSelf
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white font-bold text-2xl">SJ</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Sarah Johnson</h3>
              <p className="text-blue-600 mb-3">Editor-in-Chief</p>
              <p className="text-gray-600 text-sm">
                Technology enthusiast with 8+ years in web development and content strategy.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white font-bold text-2xl">MC</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Michael Chen</h3>
              <p className="text-green-600 mb-3">Content Director</p>
              <p className="text-gray-600 text-sm">
                Personal development expert and certified life coach with a passion for growth.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white font-bold text-2xl">AR</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Alex Rodriguez</h3>
              <p className="text-purple-600 mb-3">Tech Lead</p>
              <p className="text-gray-600 text-sm">
                Full-stack developer and open-source contributor passionate about modern web technologies.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-blue-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Join Our Community
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Be part of a growing community of learners, creators, and growth-minded individuals.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="#"
              className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors duration-200"
            >
              Subscribe to Newsletter
            </a>
            <a
              href="#"
              className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors duration-200"
            >
              Follow on Social
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;