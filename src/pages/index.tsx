import { SignInButton, SignOutButton, useUser } from "@clerk/nextjs";
import { type NextPage } from "next";
import Head from "next/head";
import { api, type RouterOutputs } from "~/utils/api";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime"
import Image from "next/image";
import LoadingPage from "~/components/Loader";

dayjs.extend(relativeTime)

const CreatePostWizard = () => {
  const { user } = useUser();
  if(!user) return null;
  console.log(user)

  return (
    <div className="flex gap-3 w-full">
      <Image src={user.profileImageUrl} alt="User's profile image" className="w-14 h-14 rounded-full" height={56} width={56} />
      <input placeholder="Type some emojis!" className="bg-transparent grow"/>
    </div>
  )
}

type PostWithUser = RouterOutputs["posts"]["getAll"][number]

const PostView = (props: PostWithUser) => {
  const { post, author } = props
  return (
    <div key={post.id} className="flex gap-3 border-b border-slate-400 p-4">
      <Image src={author.profileImage} className="h-14 w-14 rounded-full" alt={`${author.username}'s profile image`} height={56} width={56}/>
      <div className="flex flex-col">
        <div className="flex text-slate-400 gap-1">
          <span>{`@${author.username}`}</span>
          <span>{`  · ${dayjs(post.createdAt).fromNow()}`}</span>
        </div>
        <span>{post.content}</span>
      </div>
    </div>
  );
}

const Feed = () => {
  const { data, isLoading: postsLoading } = api.posts.getAll.useQuery();

  if (postsLoading) return <LoadingPage />

  if (!data) return <div>Something went wrong</div>;

  return (
    <div className="flex flex-col">
      {[...data, ...data]?.map((fullPost) => (
        <PostView {...fullPost} key={fullPost.post.id} />
      ))}
    </div>
  );
};

const Home: NextPage = () => {
  const { isSignedIn, isLoaded: userLoaded } = useUser();
  //Start fetching asap
  const { data } = api.posts.getAll.useQuery()

  // Return empty div if BOTH aren't loaded since user tends to load faster
  if (!userLoaded) return <div />

  

  return (
    <>
      <Head>
        <title>Create T3 App</title>
        <meta name="description" content="Generated by create-t3-app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="flex justify-center h-screen">
        <div className="w-full md:max-w-2xl h-full border-x border-slate-400">
        <div className="border-b border-slate-400 p-4">
          {!isSignedIn && <div className="flex justify-center"><SignInButton /></div>}
          {!!isSignedIn && <CreatePostWizard />}
        </div>
        <Feed />
        </div>
      </main>
    </>
  );
};

export default Home;
