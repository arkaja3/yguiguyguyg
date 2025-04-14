import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Clock, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import prisma from '@/lib/prisma'
import Script from 'next/script'

// Тип для параметров динамического маршрута
type BlogPostParams = {
  params: { slug: string }
}

// Генерация метаданных для постов блога
export async function generateMetadata({ params }: BlogPostParams): Promise<Metadata> {
  const { slug } = params

  // Получаем пост из базы данных
  const post = await prisma.blogPost.findUnique({
    where: { slug }
  })

  if (!post) {
    return {
      title: 'Пост не найден',
      description: 'К сожалению, запрашиваемый пост не найден'
    }
  }

  const formattedDate = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString('ru-RU')
    : new Date(post.createdAt).toLocaleDateString('ru-RU')

  return {
    title: post.title,
    description: post.excerpt || `${post.content.substring(0, 160)}...`,
    alternates: {
      canonical: `/blog/${slug}`
    },
    openGraph: {
      title: post.title,
      description: post.excerpt || `${post.content.substring(0, 160)}...`,
      type: 'article',
      publishedTime: post.publishedAt || post.createdAt,
      modifiedTime: post.updatedAt,
      url: `/blog/${slug}`,
      images: [
        {
          url: post.imageUrl || '/images/default-blog.jpg',
          width: 1200,
          height: 630,
          alt: post.title
        }
      ]
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt || `${post.content.substring(0, 160)}...`,
      images: [post.imageUrl || '/images/default-blog.jpg']
    }
  }
}

// Основной компонент страницы
export default async function BlogPostPage({ params }: BlogPostParams) {
  const { slug } = params

  // Получаем пост из базы данных
  const post = await prisma.blogPost.findUnique({
    where: { slug }
  })

  // Если пост не найден, показываем страницу 404
  if (!post) {
    return notFound()
  }

  const defaultImage = '/images/default-blog.jpg'

  // Расчет времени чтения
  const readTime = Math.max(1, Math.ceil(post.content.length / 1000)) + ' мин'

  // Форматирование даты публикации
  const publishedDate = post.publishedAt
    ? new Date(post.publishedAt)
    : new Date(post.createdAt)

  // Структурированные данные для статьи
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    'headline': post.title,
    'description': post.excerpt || post.content.substring(0, 160),
    'image': post.imageUrl || defaultImage,
    'datePublished': post.publishedAt || post.createdAt,
    'dateModified': post.updatedAt,
    'author': {
      '@type': 'Organization',
      'name': 'RoyalTransfer',
      'url': 'https://royaltransfer.org'
    },
    'publisher': {
      '@type': 'Organization',
      'name': 'RoyalTransfer',
      'logo': {
        '@type': 'ImageObject',
        'url': 'https://royaltransfer.org/images/logo.png'
      }
    },
    'mainEntityOfPage': {
      '@type': 'WebPage',
      '@id': `https://royaltransfer.org/blog/${slug}`
    },
    'inLanguage': 'ru-RU'
  }

  return (
    <>
      <Script
        id="blog-post-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Header />
      <div className="min-h-screen">
        <div className="container mx-auto px-4 py-12 md:py-20">
          <div className="mb-8">
            <Link href="/blog">
              <Button variant="outline" className="group mb-6">
                <ArrowLeft className="mr-2 w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                <span>Вернуться к списку</span>
              </Button>
            </Link>
          </div>

          <article className="max-w-4xl mx-auto">
            <div
              className="h-[300px] md:h-[400px] w-full bg-cover bg-center rounded-xl mb-8 relative"
              style={{
                backgroundImage: `url(${post.imageUrl || defaultImage})`
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-black/20 rounded-xl flex flex-col justify-end p-6 md:p-8">
                <h1 className="text-2xl md:text-4xl font-bold text-white mb-4">{post.title}</h1>
                <div className="flex items-center space-x-4 text-white">
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    <span className="text-sm">{readTime}</span>
                  </div>
                  <div className="text-sm">{publishedDate.toLocaleDateString('ru-RU')}</div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 md:p-8 shadow-sm">
              <div
                className="prose dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: post.content }}
              />
            </div>
          </article>
        </div>
      </div>
      <Footer />
    </>
  )
}
