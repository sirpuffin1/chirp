import { SignInButton, useUser } from "@clerk/nextjs";
import { type NextPage } from "next";
import { api } from "~/utils/api";
import Image from "next/image";
import LoadingPage, { Loader } from "~/components/Loader";
import toast from "react-hot-toast";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Layout from "~/components/Layout";
import PostView from "~/components/PostView";

export const emojiValidator = z
  .string()
  .emoji("Only emojis are allowed.")
  .min(1)
  .max(280);

const postInputSchema = z.object({
  content: emojiValidator,
});

type PostInputSchemaType = z.infer<typeof postInputSchema>;


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

  const { handleSubmit, register, reset, watch, formState: {isValid} } = useForm<PostInputSchemaType>(
    {
      resolver: zodResolver(postInputSchema),
    }
  );

  const content = watch("content");

  if (!user) return null;

  function onSubmit(data: PostInputSchemaType) {
    mutate(data)    
  }

 function handlePostButtonClick() {
      if (isValid) {
       // eslint-disable-next-line @typescript-eslint/no-floating-promises
       handleSubmit(onSubmit)();
      } else {
        toast.error('Only emojis are allowed.');
      }
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
        <button onClick={handlePostButtonClick} type="submit">
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

const Feed = () => {
  const { data, isLoading: postsLoading } = api.posts.getAll.useQuery();

  if (postsLoading) return <LoadingPage />;

  if (!data) return <div>Something went wrong</div>;

  return (
    <div className="flex grow flex-col overflow-y-scroll hide-scrollbar">
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
    <Layout>
      <div className="border-b border-slate-400 p-4">
        {!isSignedIn && (
          <div className="flex justify-center">
            <SignInButton />
          </div>
        )}
        {!!isSignedIn && <CreatePostWizard />}
      </div>
      <Feed />
    </Layout>
  );
};

export default Home;
