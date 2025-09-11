import { Link } from "react-router-dom";

import AvatarSvg from "@/assets/avatar.svg?react";
import BellSvg from "@/assets/bell.svg?react";

function Header() {
    const isLoggedIn = false;

    return (
        <header className="header-height sticky top-0 bg-white px-6 py-4 shadow-md">
            <div className="text-container flex items-center justify-between">
                <div className="flex-shrink-0 cursor-default">
                    <h1 className="text-xl font-bold text-gray-900">Family Tree</h1>
                </div>

                <nav className="hidden items-center space-x-8 md:flex">
                    <Link to="/" className="text-gray-600 hover:text-gray-900">
                        Home
                    </Link>
                    <Link to="/about" className="text-gray-600 hover:text-gray-900">
                        About
                    </Link>
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
                            <button className="cursor-pointer rounded border border-gray-900 bg-white px-5 py-1 font-medium text-gray-900 transition-colors duration-200 hover:bg-gray-600 hover:text-white">
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
