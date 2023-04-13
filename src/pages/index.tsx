import { SignInButton, useUser } from "@clerk/nextjs";
import { type NextPage } from "next";
import Head from "next/head";
import { api, type RouterOutputs } from "~/utils/api";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import Image from "next/image";
import LoadingPage, { Loader } from "~/components/Loader";
import toast from "react-hot-toast";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";

export const emojiValidator = z
  .string()
  .emoji("Only emojis are allowed.")
  .min(1)
  .max(280);

const postInputSchema = z.object({
  content: emojiValidator,
});

type PostInputSchemaType = z.infer<typeof postInputSchema>;

dayjs.extend(relativeTime);

const CreatePostWizard = () => {
  const { user } = useUser();

  const ctx = api.useContext();
  const { mutate, isLoading: isPosting } = api.posts.create.useMutation({
    onSuccess: () => {
      reset();
      void ctx.posts.getAll.invalidate();
    },
    onError: (e) => {
      const errorMessage = e.data?.zodError?.fieldErrors.content;
      if (errorMessage && errorMessage[0]) {
        toast.error(errorMessage[0]);
      } else {
        toast.error("Failed to post. Please try again later!");
      }
    },
  });

  const { handleSubmit, register, reset, watch } = useForm<PostInputSchemaType>(
    {
      resolver: zodResolver(postInputSchema),
    }
  );

  const content = watch("content");

  if (!user) return null;

  function onSubmit(data: PostInputSchemaType) {
    mutate(data);
  }

  return (
    <div className="flex w-full gap-3">
      <Image
        src={user.profileImageUrl}
        alt="User's profile image"
        className="h-14 w-14 rounded-full"
        height={56}
        width={56}
      />

      <form onSubmit={handleSubmit(onSubmit)} className="flex w-full">
        <input
          placeholder="Type some emojis!"
          className="grow bg-transparent"
          {...register("content")}
          disabled={isPosting}
        />
      </form>

      {content && !isPosting && (
        <button onClick={handleSubmit(onSubmit)} type="submit">
          Post
        </button>
      )}

      {isPosting && (
        <div className="flex items-center justify-center">
          <Loader size={20} />
        </div>
      )}
    </div>
  );
};

type PostWithUser = RouterOutputs["posts"]["getAll"][number];

const PostView = (props: PostWithUser) => {
  const { post, author } = props;
  return (
    <div key={post.id} className="flex gap-3 border-b border-slate-400 p-4">
      <Image
        src={author.profileImage}
        className="h-14 w-14 rounded-full"
        alt={`${author.username}'s profile image`}
        height={56}
        width={56}
      />
      <div className="flex flex-col">
        <div className="flex gap-1 text-slate-400">
          <Link href={`/@${author.username}`}>
            <span>{`@${author.username}`}</span>
          </Link>
          <Link href={`/post/${post.id}`}>
            <span>{`  · ${dayjs(post.createdAt).fromNow()}`}</span>
          </Link>
        </div>
        <span className="text-2xl">{post.content}</span>
      </div>
    </div>
  );
};

const Feed = () => {
  const { data, isLoading: postsLoading } = api.posts.getAll.useQuery();

  if (postsLoading) return <LoadingPage />;

  if (!data) return <div>Something went wrong</div>;

  return (
    <div className="flex flex-col">
      {data.map((fullPost) => (
        <PostView {...fullPost} key={fullPost.post.id} />
      ))}
    </div>
  );
};

const Home: NextPage = () => {
  const { isSignedIn, isLoaded: userLoaded } = useUser();
  //Start fetching asap
  const { data } = api.posts.getAll.useQuery();

  // Return empty div if BOTH aren't loaded since user tends to load faster
  if (!userLoaded) return <div />;

  return (
    <main className="flex h-screen justify-center">
      <div className="h-full w-full border-x border-slate-400 md:max-w-2xl">
        <div className="border-b border-slate-400 p-4">
          {!isSignedIn && (
            <div className="flex justify-center">
              <SignInButton />
            </div>
          )}
          {!!isSignedIn && <CreatePostWizard />}
        </div>
        <Feed />
      </div>
    </main>
  );
};

export default Home;
