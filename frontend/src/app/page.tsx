'use client';

import React from 'react';
import Link from 'next/link';
import { BookOpen, Sparkles, Heart, Brain, Users, Star, ArrowRight } from "lucide-react";
import Layout from '../components/Layout';

export default function Home() {
  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50">

      {/* 英雄区域 */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="mb-8">
            <h1 className="text-5xl md:text-7xl font-bold text-gray-800 mb-6">
              你的一生
              <span className="text-orange-600 relative">
                阅读伙伴
                <Sparkles className="absolute -top-2 -right-2 h-8 w-8 text-yellow-500" />
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              让 AI 成为你的阅读导师，深度理解每一本书，
              <br className="hidden md:block" />
              让知识真正融入你的生活
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                href="/upload"
                className="bg-orange-600 text-white px-8 py-4 rounded-2xl text-lg font-semibold hover:bg-orange-700 transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center space-x-2"
              >
                <span>开始智慧阅读</span>
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                href="#features"
                className="border-2 border-orange-600 text-orange-600 px-8 py-4 rounded-2xl text-lg font-semibold hover:bg-orange-50 transition-all duration-300"
              >
                了解更多
              </Link>
            </div>
          </div>
          
          {/* 特色标签 */}
          <div className="flex flex-wrap justify-center gap-4 mb-12">
            <span className="bg-white/70 backdrop-blur-sm px-4 py-2 rounded-full text-gray-700 border border-orange-200">
              <Brain className="inline h-4 w-4 mr-2 text-orange-600" />
              AI 智能分析
            </span>
            <span className="bg-white/70 backdrop-blur-sm px-4 py-2 rounded-full text-gray-700 border border-orange-200">
              <Heart className="inline h-4 w-4 mr-2 text-red-500" />
              个性化推荐
            </span>
            <span className="bg-white/70 backdrop-blur-sm px-4 py-2 rounded-full text-gray-700 border border-orange-200">
              <Users className="inline h-4 w-4 mr-2 text-blue-500" />
              社区分享
            </span>
          </div>
        </div>
      </section>
      
      {/* 功能特色区域 */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-white/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6">
              AI赋能的
              <span className="text-orange-600">智慧阅读</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              三大核心功能，让每一次阅读都更有价值
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {/* 智能总结 */}
            <div className="group bg-white/70 backdrop-blur-sm rounded-3xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:transform hover:scale-105">
              <div className="bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl p-4 w-16 h-16 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Brain className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4">AI智能总结</h3>
              <p className="text-gray-600 leading-relaxed mb-6">
                自动提取书籍精华，生成个性化摘要，
                让你快速掌握核心观点和关键信息。
              </p>
              <div className="flex items-center text-blue-600 font-semibold">
                <span>了解更多</span>
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
            
            {/* 智能问答 */}
            <div className="group bg-white/70 backdrop-blur-sm rounded-3xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:transform hover:scale-105">
              <div className="bg-gradient-to-br from-green-100 to-green-200 rounded-2xl p-4 w-16 h-16 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <BookOpen className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4">智能问答</h3>
              <p className="text-gray-600 leading-relaxed mb-6">
                与AI对话，深入探讨书中内容，
                获得个性化的解答和深度思考。
              </p>
              <div className="flex items-center text-green-600 font-semibold">
                <span>了解更多</span>
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
            
            {/* 个性化推荐 */}
            <div className="group bg-white/70 backdrop-blur-sm rounded-3xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:transform hover:scale-105">
              <div className="bg-gradient-to-br from-purple-100 to-purple-200 rounded-2xl p-4 w-16 h-16 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Heart className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4">个性化推荐</h3>
              <p className="text-gray-600 leading-relaxed mb-6">
                基于你的阅读偏好和历史，
                智能推荐最适合你的下一本书。
              </p>
              <div className="flex items-center text-purple-600 font-semibold">
                <span>了解更多</span>
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 体验展示区域 */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white/50">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6">
                让阅读成为
                <span className="text-orange-600">生活的艺术</span>
              </h2>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                每一次翻页，都是与智慧的邂逅。我们相信，好的阅读工具应该像一位贴心的朋友，
                在你需要的时候给予帮助，在你迷茫的时候指引方向。
              </p>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="bg-orange-100 rounded-full p-2">
                    <Star className="h-5 w-5 text-orange-600" />
                  </div>
                  <span className="text-gray-700">智能书籍管理，让你的图书馆井然有序</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="bg-orange-100 rounded-full p-2">
                    <Star className="h-5 w-5 text-orange-600" />
                  </div>
                  <span className="text-gray-700">深度阅读分析，发现你的阅读偏好</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="bg-orange-100 rounded-full p-2">
                    <Star className="h-5 w-5 text-orange-600" />
                  </div>
                  <span className="text-gray-700">社区分享功能，与志同道合的朋友交流</span>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="bg-gradient-to-br from-orange-200 to-rose-200 rounded-3xl p-8 transform rotate-3">
                <div className="bg-white rounded-2xl p-6 transform -rotate-3 shadow-xl">
                  <div className="space-y-4">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-4 bg-orange-200 rounded w-2/3"></div>
                    <div className="h-20 bg-gradient-to-r from-orange-100 to-rose-100 rounded-lg flex items-center justify-center">
                      <BookOpen className="h-8 w-8 text-orange-600" />
                    </div>
                    <div className="h-4 bg-gray-200 rounded w-4/5"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/5"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 用户评价区域 */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
              用户的<span className="text-orange-600">真实感受</span>
            </h2>
            <p className="text-xl text-gray-600">
              听听他们怎么说
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
              <div className="flex items-center mb-4">
                <div className="bg-gradient-to-r from-orange-400 to-rose-400 rounded-full w-12 h-12 flex items-center justify-center text-white font-bold">
                  李
                </div>
                <div className="ml-3">
                  <h4 className="font-semibold text-gray-800">李小雨</h4>
                  <p className="text-gray-600 text-sm">资深读者</p>
                </div>
              </div>
              <p className="text-gray-600 italic">
                "ReadWise让我重新爱上了阅读。AI总结功能帮我快速理解复杂的学术书籍，节省了大量时间。"
              </p>
            </div>
            
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
              <div className="flex items-center mb-4">
                <div className="bg-gradient-to-r from-blue-400 to-purple-400 rounded-full w-12 h-12 flex items-center justify-center text-white font-bold">
                  王
                </div>
                <div className="ml-3">
                  <h4 className="font-semibold text-gray-800">王大明</h4>
                  <p className="text-gray-600 text-sm">企业管理者</p>
                </div>
              </div>
              <p className="text-gray-600 italic">
                "作为忙碌的管理者，ReadWise的智能推荐让我总能找到最适合的商业书籍。真的很棒！"
              </p>
            </div>
            
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
              <div className="flex items-center mb-4">
                <div className="bg-gradient-to-r from-green-400 to-teal-400 rounded-full w-12 h-12 flex items-center justify-center text-white font-bold">
                  张
                </div>
                <div className="ml-3">
                  <h4 className="font-semibold text-gray-800">张小文</h4>
                  <p className="text-gray-600 text-sm">大学生</p>
                </div>
              </div>
              <p className="text-gray-600 italic">
                "智能问答功能太实用了！遇到不懂的地方可以直接提问，就像有个私人导师一样。"
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA区域 */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-gradient-to-r from-orange-600 to-rose-600 rounded-3xl p-12 text-white">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              开始你的智慧阅读之旅
            </h2>
            <p className="text-xl mb-8 opacity-90">
              加入数万名用户，让AI成为你的阅读伙伴
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/upload"
                className="bg-white text-orange-600 px-8 py-4 rounded-2xl text-lg font-semibold hover:bg-gray-50 transition-colors flex items-center justify-center space-x-2"
              >
                <span>免费开始使用</span>
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                href="/books"
                className="border-2 border-white text-white px-8 py-4 rounded-2xl text-lg font-semibold hover:bg-white/10 transition-colors"
              >
                查看书库
              </Link>
            </div>
          </div>
        </div>
      </section>


      </div>
    </Layout>
  );
}
