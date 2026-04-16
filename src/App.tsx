import { lazy } from "react";
import { Route, Routes } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";

const Home = lazy(() => import("@/pages/Home").then((m) => ({ default: m.Home })));
const Browse = lazy(() => import("@/pages/Browse").then((m) => ({ default: m.Browse })));
const Categories = lazy(() => import("@/pages/Categories").then((m) => ({ default: m.Categories })));
const Submit = lazy(() => import("@/pages/Submit").then((m) => ({ default: m.Submit })));
const Leaderboard = lazy(() => import("@/pages/Leaderboard").then((m) => ({ default: m.Leaderboard })));
const Blog = lazy(() => import("@/pages/Blog").then((m) => ({ default: m.Blog })));
const BlogPost = lazy(() => import("@/pages/BlogPost").then((m) => ({ default: m.BlogPost })));
const Premium = lazy(() => import("@/pages/Premium").then((m) => ({ default: m.Premium })));
const Login = lazy(() => import("@/pages/Login").then((m) => ({ default: m.Login })));
const Register = lazy(() => import("@/pages/Register").then((m) => ({ default: m.Register })));
const Dashboard = lazy(() => import("@/pages/Dashboard").then((m) => ({ default: m.Dashboard })));
const About = lazy(() => import("@/pages/About").then((m) => ({ default: m.About })));
const Contact = lazy(() => import("@/pages/Contact").then((m) => ({ default: m.Contact })));
const Privacy = lazy(() => import("@/pages/Privacy").then((m) => ({ default: m.Privacy })));
const Terms = lazy(() => import("@/pages/Terms").then((m) => ({ default: m.Terms })));
const Disclaimer = lazy(() => import("@/pages/Disclaimer").then((m) => ({ default: m.Disclaimer })));
const NotFound = lazy(() => import("@/pages/NotFound").then((m) => ({ default: m.NotFound })));

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="browse" element={<Browse />} />
        <Route path="categories" element={<Categories />} />
        <Route path="submit" element={<Submit />} />
        <Route path="leaderboard" element={<Leaderboard />} />
        <Route path="blog" element={<Blog />} />
        <Route path="blog/:slug" element={<BlogPost />} />
        <Route path="premium" element={<Premium />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="about" element={<About />} />
        <Route path="contact" element={<Contact />} />
        <Route path="privacy" element={<Privacy />} />
        <Route path="terms" element={<Terms />} />
        <Route path="disclaimer" element={<Disclaimer />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
