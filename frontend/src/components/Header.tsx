import { NavLink } from "react-router-dom";

import AvatarSvg from "@/assets/avatar.svg?react";
import BellSvg from "@/assets/bell.svg?react";

const linkBaseClasses = "text-gray-600 hover:text-gray-900";
const linkActiveClasses =
    "text-gray-900 underline underline-offset-4 underline-gray-900 decoration-2";

function Header() {
    // TODO properly load log-in information
    const isLoggedIn = false;

    return (
        <header className="header-height sticky top-0 bg-white px-6 py-4 shadow-md">
            <div className="text-container flex items-center justify-between">
                <div className="flex-shrink-0 cursor-default">
                    <h1 className="text-xl font-bold text-gray-900">Stammbaum Hell</h1>
                </div>

                <nav className="hidden items-center space-x-8 md:flex">
                    <NavLink
                        to="/"
                        className={({ isActive }) =>
                            `${linkBaseClasses} ${isActive ? linkActiveClasses : ""}`
                        }
                    >
                        Home
                    </NavLink>
                    <NavLink
                        to="/feedback"
                        className={({ isActive }) =>
                            `${linkBaseClasses} ${isActive ? linkActiveClasses : ""}`
                        }
                    >
                        Feedback
                    </NavLink>
                </nav>

                <div className="flex items-center space-x-4">
                    {isLoggedIn ? (
                        <>
                            <button className="cursor-pointer p-1 text-gray-600 hover:text-gray-900">
                                <BellSvg className="h-6 w-6" />
                            </button>
                            <button className="h-8 w-8 cursor-pointer">
                                <AvatarSvg />
                            </button>
                        </>
                    ) : (
                        <>
                            <button className="cursor-pointer border border-gray-900 bg-white px-5 py-1 font-medium text-gray-900 transition-colors duration-200 hover:bg-gray-600 hover:text-white">
                                Sign In
                            </button>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
}

export default Header;
