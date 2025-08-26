'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { postSchema, Post } from "@/schemas/post";
import { Button } from "@/components/ui/Button";