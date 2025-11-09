"use client";
import { motion, MotionProps } from "framer-motion";

export default function MotionDiv(props: MotionProps & {className?:string; children:React.ReactNode}){
    return (
        <motion.div
            initial={{ opacity:0, y:8 }}
            animate={{ opacity:1, y:0 }}
            transition={{ duration:.35, ease:"easeOut" }}
            {...props}
        />
);
}