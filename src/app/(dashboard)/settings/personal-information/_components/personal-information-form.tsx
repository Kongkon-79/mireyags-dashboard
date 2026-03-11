"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useSession } from "next-auth/react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { UserProfileApiResponse } from "../../_components/user-data-type"
import { useEffect } from "react"
import { toast } from "sonner"
import PersonalInfoSkeleton from "../../_components/personal-info-skeleton"

const formSchema = z.object({
  firstName: z.string().min(2, {
    message: "First Name must be at least 2 characters.",
  }),
  lastName: z.string().min(2, {
    message: "Last Name must be at least 2 characters.",
  }),
  email: z.string().min(2, {
    message: "Email must be at least 2 characters.",
  }),
  phone: z.string().min(2, {
    message: "Phone Number must be at least 2 characters.",
  }),
})

const PersonalInformationForm = () => {
  const queryClient = useQueryClient();

  const { data: session } = useSession()
  const token = (session?.user as { accessToken?: string })?.accessToken


  const { data, isLoading } = useQuery<UserProfileApiResponse>({
    queryKey: ["user-profile"],
    queryFn: async () => {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/user/profile`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )
      return res.json()
    },
    enabled: !!token,
    staleTime: 1000 * 60 * 5,
  })

  console.log(data)






  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",

    },
  })

  useEffect(() => {
    if (data?.data?.user) {
      const user = data.data.user

      form.reset({
        firstName: user.firstName ?? "",
        lastName: user.lastName ?? "",
        email: user.email ?? "",
        phone: user.phone ?? "",
      })
    }
  }, [data, form])






  const { mutate, isPending } = useMutation({
    mutationKey: ["update-profile"],
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/user/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(values)
      })
      return res.json()
    },
    onSuccess: async (data) => {
      if (!data?.success) {
        toast.error(data?.message || "Something went wrong")
        return
      }
      toast.success(data?.message || "Profile updated successfully")
      await queryClient.invalidateQueries({ queryKey: ["user-profile"] })
    },
    onError: () => toast.error("Update failed"),
  })

  // loading 
  if (isLoading) {
    return <div className="">
      <PersonalInfoSkeleton/>
    </div>
  }

  // 2. Define a submit handler.
  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values)

    mutate(values)
  }

  return (
    <div className='h-full py-6 px-8 bg-white rounded-[8px] shadow-[0_4px_8px_rgba(0,0,0,0.12)]'>
      <div>
        <h4 className='text-xl md:text-2xl text-[#343A40] leading-[120%] font-semibold'>Personal Information</h4>
      </div>
      {/* form  */}
      <div className="pt-10">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base text-[#3B4759] leading-[120%] font-medium">First Name</FormLabel>
                    <FormControl>
                      <Input className="h-[48px] w-full rounded-[4px] border-[#C0C3C1] p-3 placeholder:text-[#8E959F] text-[#3B4759] text-base ring-0 outline-none leading-[120%] font-normal" placeholder="Maria Jasmin" {...field} />
                    </FormControl>
                    <FormMessage className="text-red-500" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base text-[#3B4759] leading-[120%] font-medium">Last Name</FormLabel>
                    <FormControl>
                      <Input className="h-[48px] w-full rounded-[4px] border-[#C0C3C1] p-3 placeholder:text-[#8E959F] text-[#3B4759] text-base ring-0 outline-none leading-[120%] font-normal" placeholder="Maria Jasmin" {...field} />
                    </FormControl>
                    <FormMessage className="text-red-500" />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base text-[#3B4759] leading-[120%] font-medium">Email Address</FormLabel>
                    <FormControl>
                      <Input disabled className="h-[48px] w-full rounded-[4px] border-[#C0C3C1] p-3 placeholder:text-[#8E959F] text-[#3B4759] text-base ring-0 outline-none leading-[120%] font-normal" placeholder="bessieedwards@gmail.com" {...field} />
                    </FormControl>
                    <FormMessage className="text-red-500" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base text-[#3B4759] leading-[120%] font-medium">Phone Number</FormLabel>
                    <FormControl>
                      <Input className="h-[48px] w-full rounded-[4px] border-[#C0C3C1] p-3 placeholder:text-[#8E959F] text-[#3B4759] text-base ring-0 outline-none leading-[120%] font-normal" placeholder="+1 (555) 123-4567" {...field} />
                    </FormControl>
                    <FormMessage className="text-red-500" />
                  </FormItem>
                )}
              />

            </div>
            <div className="w-full flex items-center justify-center pt-5">
              {/* <Button
                type="button"
                variant="outline"
                onClick={() => form.reset()}
                className="h-[47px] text-sm text-[#E5102E] leading-[120%] font-medium py-4 px-6 rounded-[6px] border border-[#E5102E]"
              >
                Discard Changes
              </Button> */}


              <Button disabled={isPending} className="h-[47px] text-base text-[#F8F9FA] leading-[120%] font-medium py-4 px-20 rounded-[6px]" type="submit">{isPending ? "Updating..." : "Save"}</Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  )
}

export default PersonalInformationForm