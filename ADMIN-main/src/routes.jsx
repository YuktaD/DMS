import {
  HomeIcon,
  UserCircleIcon,
  ServerStackIcon,
  RectangleStackIcon,
  DocumentIcon,
  KeyIcon,
} from "@heroicons/react/24/solid";
import { Home, Profile, AddDocument } from "@/pages/dashboard";
import { SignIn, SignUp, ForgotPassword } from "@/pages/auth";

const icon = { className: "w-5 h-5 text-inherit" };

export const routes = [
  {
    layout: "dashboard",
    pages: [
      { icon: <HomeIcon {...icon} />, name: "dashboard", path: "/home", element: <Home /> },
      { icon: <UserCircleIcon {...icon} />, name: "profile", path: "/profile", element: <Profile /> },
      { icon: <DocumentIcon {...icon} />, name: "Add Documents", path: "/upload", element: <AddDocument /> },
    ],
  },
  {
    title: "auth pages",
    layout: "auth",
    pages: [
      { icon: <ServerStackIcon {...icon} />, name: "sign in", path: "/sign-in", element: <SignIn /> },
      { icon: <RectangleStackIcon {...icon} />, name: "sign up", path: "/sign-up", element: <SignUp /> },
      { icon: <KeyIcon {...icon} />, name: "forgot-password", path: "/forgot-password", element: <ForgotPassword /> },
    ],
  },
];

export default routes;
