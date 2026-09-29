export const Logo = ({ className = "w-8 h-8", size }: { className?: string; size?: number }) => {
    const dimension = size ? `${size}px` : undefined;
    return (
        <div className={`flex items-center gap-2 font-bold tracking-tight text-xl ${className}`} style={{ width: dimension, height: dimension }}>
            <div className="relative flex items-center justify-center w-9 h-9 bg-gradient-to-br from-indigo-600 via-indigo-500 to-purple-600 rounded-xl shadow-md shadow-indigo-500/20 text-white font-extrabold tracking-wider">
                <span className="text-lg">T</span>
                <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white dark:border-gray-900 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                </div>
            </div>
            <div className="flex flex-col">
                <span className="bg-gradient-to-r from-gray-900 via-indigo-950 to-indigo-800 dark:from-white dark:to-indigo-300 bg-clip-text text-transparent text-xl font-black">
                    Trellix
                </span>
                <span className="text-[10px] font-medium tracking-widest text-indigo-500 uppercase -mt-1">
                    Boards
                </span>
            </div>
        </div>
    );
};
