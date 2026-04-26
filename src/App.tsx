import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";

// Lazy load pages
const Home = lazy(() => import("@/pages/Home").then(m => ({ default: m.Home })));
const Browse = lazy(() => import("@/pages/Browse").then(m => ({ default: m.Browse })));
const Categories = lazy(() => import("@/pages/Categories").then(m => ({ default: m.Categories })));
const Submit = lazy(() => import("@/pages/Submit").then(m => ({ default: m.Submit })));
const Leaderboard = lazy(() => import("@/pages/Leaderboard").then(m => ({ default: m.Leaderboard })));
const Blog = lazy(() => import("@/pages/Blog").then(m => ({ default: m.Blog })));
const BlogPost = lazy(() => import("@/pages/BlogPost").then(m => ({ default: m.BlogPost })));
const Premium = lazy(() => import("@/pages/Premium").then(m => ({ default: m.Premium })));
const Login = lazy(() => import("@/pages/Login").then(m => ({ default: m.Login })));
const Register = lazy(() => import("@/pages/Register").then(m => ({ default: m.Register })));
const Dashboard = lazy(() => import("@/pages/Dashboard").then(m => ({ default: m.Dashboard })));
const AffiliateConsole = lazy(() => import("@/pages/AffiliateConsole").then(m => ({ default: m.AffiliateConsole })));
const About = lazy(() => import("@/pages/About").then(m => ({ default: m.About })));
const Contact = lazy(() => import("@/pages/Contact").then(m => ({ default: m.Contact })));
const Privacy = lazy(() => import("@/pages/Privacy").then(m => ({ default: m.Privacy })));
const Terms = lazy(() => import("@/pages/Terms").then(m => ({ default: m.Terms })));
const Disclaimer = lazy(() => import("@/pages/Disclaimer").then(m => ({ default: m.Disclaimer })));
const Disclosure = lazy(() => import("@/pages/Disclosure").then(m => ({ default: m.Disclosure })));
const NotFound = lazy(() => import("@/pages/NotFound").then(m => ({ default: m.NotFound })));
const Admin = lazy(() => import("@/pages/Admin").then(m => ({ default: m.Admin })));
const Program = lazy(() => import("@/pages/Program").then(m => ({ default: m.Program })));
const OfferRedirect = lazy(() => import("@/pages/OfferRedirect").then(m => ({ default: m.OfferRedirect })));

const LoadingSpinner = () => (
  <div className="flex min-h-[60vh] items-center justify-center">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-neon border-t-transparent"></div>
  </div>
);

export default function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
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
          <Route path="program/:id" element={<Program />} />
          <Route path="offer/:id" element={<OfferRedirect />} />
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="affiliate" element={<AffiliateConsole />} />
          <Route path="about" element={<About />} />
          <Route path="contact" element={<Contact />} />
          <Route path="privacy" element={<Privacy />} />
          <Route path="terms" element={<Terms />} />
          <Route path="disclosure" element={<Disclosure />} />
          <Route path="disclaimer" element={<Disclaimer />} />
          <Route path="admin" element={<Admin />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
