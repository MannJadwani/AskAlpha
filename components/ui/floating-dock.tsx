import { cn } from "@/lib/utils";
import { IconLayoutNavbarCollapse } from "@tabler/icons-react";
import {
  AnimatePresence,
  MotionValue,
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from "motion/react";

import { useRef, useState } from "react";
import Image from "next/image";
import { ShinyButton } from "@/components/magicui/shiny-button";

export const FloatingDock = ({
  items,
  desktopClassName,
  mobileClassName,
}: {
  items: { title: string; icon: React.ReactNode; href: string }[];
  desktopClassName?: string;
  mobileClassName?: string;
}) => {
  return (
    <>
      <FloatingDockDesktop items={items} className={desktopClassName} />
      <FloatingDockMobile items={items} className={mobileClassName} />
    </>
  );
};

const FloatingDockMobile = ({
  items,
  className,
}: {
  items: { title: string; icon: React.ReactNode; href: string }[];
  className?: string;
}) => {
  const [open, setOpen] = useState(false);
  return (
    <div className={cn("relative block md:hidden", className)}>
      <AnimatePresence>
        {open && (
          <motion.div
            layoutId="nav"
            className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2"
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            {/* Floating dock container */}
            <div className="flex items-center gap-2 rounded-2xl bg-white/10 p-2 ring-1 ring-inset ring-white/20 backdrop-blur-md shadow-lg">
              {/* Home logo */}
              <a href="/" className="flex items-center justify-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 ring-1 ring-inset ring-white/20">
                  <div className="relative h-4 w-4">
                    <Image src="/assets/logo/icon.png" alt="AskAlpha" width="16" height="16" className="h-4 w-4 object-contain" />
                  </div>
                </div>
              </a>
              
              {/* Navigation items */}
              {items.slice(0, -1).map((item, idx) => (
                <motion.a
                  key={item.title}
                  href={item.href}
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 ring-1 ring-inset ring-white/10 text-zinc-300 hover:bg-white/10 hover:text-white transition-all duration-200"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.05, duration: 0.2 }}
                >
                  <div className="h-4 w-4">{item.icon}</div>
                </motion.a>
              ))}
              
              {/* Get started button - smaller for mobile dock */}
              <motion.a
                href={items[items.length - 1]?.href}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3, duration: 0.2 }}
              >
                <ShinyButton className="h-10 px-4 !bg-white !text-black !ring-white/20 text-xs font-semibold">
                  Start
                </ShinyButton>
              </motion.a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Toggle button */}
      <motion.button
        onClick={() => setOpen(!open)}
        className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 ring-1 ring-inset ring-white/20 text-zinc-200 backdrop-blur-md shadow-lg hover:bg-white/15 transition-all duration-200"
        whileTap={{ scale: 0.95 }}
        animate={{ rotate: open ? 180 : 0 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
      >
        <IconLayoutNavbarCollapse className="h-5 w-5 text-zinc-300" />
      </motion.button>
    </div>
  );
};

const FloatingDockDesktop = ({
  items,
  className,
}: {
  items: { title: string; icon: React.ReactNode; href: string }[];
  className?: string;
}) => {
  let mouseX = useMotionValue(Infinity);
  return (
    <motion.div
      onMouseMove={(e) => mouseX.set(e.pageX)}
      onMouseLeave={() => mouseX.set(Infinity)}
      className={cn(
        "mx-auto hidden h-16 items-center justify-center gap-4 rounded-2xl bg-white/5 px-4  md:flex border border-white/10 ring-1 ring-inset ring-white/10 backdrop-blur",
        className,
      )}
    >
      {/* Home logo at start (wide, same length as CTA) */}
      <a href="/" className="self-center">
        <div className="group relative inline-flex items-center justify-center gap-2 rounded-2xl h-11 px-6 bg-white/5 ring-1 ring-inset ring-white/10 text-zinc-200">
          <span className="relative z-10 flex items-center">
            <span className="relative h-6 w-auto">
              <Image src="/assets/logo/icon.png" alt="AskAlpha" width="130" height="24" className="h-6 w-auto object-contain" />
            </span>
          </span>
          <span className="pointer-events-none absolute -inset-px rounded-2xl ring-1 ring-white/10" />
        </div>
      </a>
      {items.map((item) => (
        <IconContainer mouseX={mouseX} key={item.title} {...item} />
      ))}
    </motion.div>
  );
};

function IconContainer({
  mouseX,
  title,
  icon,
  href,
}: {
  mouseX: MotionValue;
  title: string;
  icon: React.ReactNode;
  href: string;
}) {
  let ref = useRef<HTMLDivElement>(null);

  let distance = useTransform(mouseX, (val) => {
    let bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };

    return val - bounds.x - bounds.width / 2;
  });

  let widthTransform = useTransform(distance, [-150, 0, 150], [40, 80, 40]);
  let heightTransform = useTransform(distance, [-150, 0, 150], [40, 80, 40]);

  let widthTransformIcon = useTransform(distance, [-150, 0, 150], [20, 40, 20]);
  let heightTransformIcon = useTransform(
    distance,
    [-150, 0, 150],
    [20, 40, 20],
  );

  let width = useSpring(widthTransform, {
    mass: 0.1,
    stiffness: 150,
    damping: 12,
  });
  let height = useSpring(heightTransform, {
    mass: 0.1,
    stiffness: 150,
    damping: 12,
  });

  let widthIcon = useSpring(widthTransformIcon, {
    mass: 0.1,
    stiffness: 150,
    damping: 12,
  });
  let heightIcon = useSpring(heightTransformIcon, {
    mass: 0.1,
    stiffness: 150,
    damping: 12,
  });

  const [hovered, setHovered] = useState(false);

  if (title === "Get started") {
    return (
      <a href={href} className="self-center">
        <ShinyButton className="h-11 px-6 !bg-white !text-black !ring-white/20">Get started</ShinyButton>
      </a>
    );
  }

  return (
    <a href={href}>
      <motion.div
        ref={ref}
        style={{ width, height }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="relative flex aspect-square items-center justify-center rounded-full bg-white/10 ring-1 ring-inset ring-white/10 text-zinc-200"
      >
        <AnimatePresence>
          {hovered && (
            <motion.div
              initial={{ opacity: 0, y: 10, x: "-50%" }}
              animate={{ opacity: 1, y: 0, x: "-50%" }}
              exit={{ opacity: 0, y: 2, x: "-50%" }}
              className="absolute -top-8 left-1/2 w-fit rounded-md border border-white/10 bg-white/10 px-2 py-0.5 text-xs whitespace-pre text-zinc-200 backdrop-blur"
            >
              {title}
            </motion.div>
          )}
        </AnimatePresence>
        <motion.div
          style={{ width: widthIcon, height: heightIcon }}
          className="flex items-center justify-center"
        >
          {icon}
        </motion.div>
      </motion.div>
    </a>
  );
}
