import { GetStaticProps } from 'next';

import Head from 'next/head';
import { FiCalendar, FiUser } from 'react-icons/fi';
import Prismic from '@prismicio/client';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import Link from 'next/link';
import { useState } from 'react';
import { getPrismicClient } from '../services/prismic';
import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';
import Header from '../components/Header';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home(props: HomeProps): JSX.Element {
  const [posts, setPosts] = useState<Post[]>(props.postsPagination.results);

  async function getPost() {
    await fetch(props.postsPagination.next_page)
      .then(data => data.json())
      .then(response => {
        const postsResponse = response.results.map(post => {
          return {
            uid: post.uid,
            data: {
              title: post.data.title,
              subtitle: post.data.subtitle,
              author: post.data.author,
            },
            first_publication_date: post.first_publication_date,
          };
        });
        setPosts([...postsResponse, ...posts]);
      });
  }
  return (
    <>
      <Head>
        <title>InfoNews</title>
      </Head>
      <main className={styles.contentContainer}>
        <header className={styles.content}>
          <Header />
        </header>
        {posts.map(post => (
          <Link href={`/post/${post.uid}`}>
            <div key={post.uid} className={styles.contentPosts}>
              <a href="/">
                <strong>{post.data.title}</strong>
                <p>{post.data.subtitle}</p>
                <div>
                  <time>
                    <FiCalendar />
                    <span>
                      {format(
                        new Date(post.first_publication_date),
                        'dd MMM yyyy',
                        {
                          locale: ptBR,
                        }
                      )}
                    </span>
                  </time>
                  <span>
                    <FiUser />
                    <span>{post.data.author}</span>
                  </span>
                </div>
              </a>
            </div>
          </Link>
        ))}
      </main>
      <footer className={styles.contentFooter}>
        {props.postsPagination.next_page && (
          <button onClick={() => getPost()} type="button">
            Carregar mais posts
          </button>
        )}
      </footer>
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query(
    [Prismic.predicates.at('document.type', 'infonews')],
    {
      fetch: [
        'infonews.title',
        'infonews.subtitle',
        'infonews.author',
        'infonews.last_publication_date',
      ],
      pageSize: 2,
    }
  );

  const posts = postsResponse.results.map(post => {
    return {
      uid: post.uid,
      first_publication_date: post.first_publication_date,
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,
      },
    };
  });

  return {
    props: {
      postsPagination: {
        next_page: postsResponse.next_page,
        results: posts,
      },
    },
  };
};
