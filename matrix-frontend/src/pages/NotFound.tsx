import { Link } from "react-router-dom";
import { buttonVariants } from "@/components/ui/button";
import { WEB_ROUTES } from "@/config/webRoutes";

export default function NotFound() {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950">
      <div className="text-center space-y-6">
        <h1 className="text-9xl font-extrabold text-zinc-300 dark:text-zinc-800">
          404
        </h1>
        <div className="space-y-2">
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Page not found
          </h2>
          <p className="text-zinc-500 dark:text-zinc-400 max-w-[500px]">
            Sorry, we couldn't find the page you're looking for. It might have
            been moved or deleted.
          </p>
        </div>
        <Link
          to={WEB_ROUTES.DASHBOARD}
          className={buttonVariants({ className: "mt-8" })}
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
