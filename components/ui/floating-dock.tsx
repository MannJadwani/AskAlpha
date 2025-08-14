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
            className="absolute inset-x-0 bottom-full mb-2 flex flex-col gap-2"
          >
            {/* Home logo at top (wide, same length as CTA) */}
            <motion.div
              key="home-logo"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
            >
              <a href="/" className="flex items-center justify-center">
                <div className="group relative inline-flex items-center justify-center gap-2 rounded-2xl h-10 px-5 bg-white/5 ring-1 ring-inset ring-white/10 text-zinc-200">
                  <span className="relative z-10 flex items-center">
                    <span className="relative h-5 w-auto">
                      <Image src="/assets/logo/icon.png" alt="AskAlpha" width="110" height="20" className="h-5 w-auto object-contain" />
                    </span>
                  </span>
                  <span className="pointer-events-none absolute -inset-px rounded-2xl ring-1 ring-white/10" />
                </div>
              </a>
            </motion.div>
            {items.map((item, idx) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 10 }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                exit={{
                  opacity: 0,
                  y: 10,
                  transition: {
                    delay: idx * 0.05,
                  },
                }}
                transition={{ delay: (items.length - 1 - idx) * 0.05 }}
              >
                {item.title === "Get started" ? (
                  <a href={item.href} className="flex items-center justify-center">
                    <ShinyButton className="h-10 px-5 !bg-white !text-black !ring-white/20">Get started</ShinyButton>
                  </a>
                ) : (
                  <a
                    href={item.href}
                    key={item.title}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 ring-1 ring-inset ring-white/10 text-zinc-200"
                  >
                    <div className="h-4 w-4">{item.icon}</div>
                  </a>
                )}
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
      <button
        onClick={() => setOpen(!open)}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 ring-1 ring-inset ring-white/10 text-zinc-200 backdrop-blur"
      >
        <IconLayoutNavbarCollapse className="h-5 w-5 text-zinc-300" />
      </button>
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
