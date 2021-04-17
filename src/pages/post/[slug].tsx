import { GetStaticPaths, GetStaticProps } from 'next';
import { RichText } from 'prismic-dom';

import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import Head from 'next/head';
import { FiCalendar, FiUser, FiClock } from 'react-icons/fi';
import { useRouter } from 'next/router';
import Prismic from '@prismicio/client';
import { getPrismicClient } from '../../services/prismic';
import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';
import Header from '../../components/Header';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    subtitle: string;
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps): JSX.Element {
  const router = useRouter();
  if (router.isFallback) {
    return <div>Carregando...</div>;
  }
  let headingWords = 0;
  let bodyWorlds = 0;
  console.log('Prismic', post.data.content);
  post.data.content.forEach(element => {
    const word = element.heading.split(' ');
    headingWords += word.length;
  });
  const bodyText = post.data.content.map(element => {
    return RichText.asText(element.body);
  });
  bodyWorlds = bodyText.join(' ').split(' ').length;
  const result = Math.ceil((headingWords + bodyWorlds) / 200);
  console.log('aexxxxwwww', result);
  return (
    <>
      <Head>
        <title>{post.data.title} | InfoNews </title>
      </Head>
      <main key={post.data.title} className={styles.contentContainer}>
        <header className={styles.content}>
          <Header />
        </header>
        <section className={styles.containerSection}>
          <div className={styles.containerImg}>
            <img src={post.data.banner.url} alt="banner" />
          </div>
        </section>
        <article className={styles.contentArticle}>
          <h1>{post.data.title}</h1>
          <div>
            <time>
              <FiCalendar />
              <span>
                {format(new Date(post.first_publication_date), 'dd MMM yyyy', {
                  locale: ptBR,
                })}
              </span>
            </time>
            <span>
              <FiUser />
              <span>{post.data.author}</span>
            </span>
            <span>
              <FiClock />
              <span> {result} min</span>
            </span>
          </div>
          <div className={styles.eachPost}>
            {post.data.content.map(htmlContext => (
              <div key={htmlContext.heading}>
                <strong>{htmlContext.heading}</strong>
                <div
                  dangerouslySetInnerHTML={{
                    __html: RichText.asHtml(htmlContext.body),
                  }}
                />
              </div>
            ))}
          </div>
        </article>
      </main>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query(
    [Prismic.predicates.at('document.type', 'infonews')],
    {
      fetch: ['infonews.slug'],
      pageSize: 1,
    }
  );

  const paths = posts.results.map(post => {
    return {
      params: {
        slug: post.uid,
      },
    };
  });

  return {
    paths,
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const { slug } = params;
  const prismic = getPrismicClient();
  const response = await prismic.getByUID('infonews', String(slug), {});
  const post = {
    uid: response.uid,
    first_publication_date: response.first_publication_date,
    data: {
      title: response.data.title,
      subtitle: response.data.subtitle,
      author: response.data.author,
      banner: {
        url: response.data.banner.url,
      },
      content: response.data.content,
    },
  };
  return {
    props: {
      post,
    },
    revalidate: 1,
  };
};
