"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GalleryVerticalEnd } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Image from "next/image"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { toast } from "sonner"; // Make sure to install: npm install sonner

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  sex: string;
  province: string;
  isSouthAfricanNative: boolean | null;
  willingToVolunteer: boolean;
}

interface FormErrors {
  [key: string]: string;
}

export function SignUpForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    sex: "",
    province: "",
    isSouthAfricanNative: null,
    willingToVolunteer: false,
  });
  const [errors, setErrors] = useState<FormErrors>({});

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required";
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email format is invalid";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }

    if (!formData.sex) {
      newErrors.sex = "Sex selection is required";
    }

    if (!formData.province) {
      newErrors.province = "Province selection is required";
    }

    if (formData.isSouthAfricanNative === null) {
      newErrors.isSouthAfricanNative = "South African native status is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error("Please fill in all required fields correctly");
      return;
    }

    if (!formData.isSouthAfricanNative) {
      toast.error("This platform is exclusively for South African natives");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Account created successfully!");
        // Redirect to sign-in page or dashboard
        router.push("/signin?message=Account created successfully. Please sign in.");
      } else {
        // Handle specific errors
        if (response.status === 409) {
          setErrors({ email: "An account with this email already exists" });
          toast.error("An account with this email already exists");
        } else if (response.status === 400 && data.details) {
          // Handle validation errors from server
          const serverErrors: FormErrors = {};
          data.details.forEach((detail: { field: string; message: string }) => {
            serverErrors[detail.field] = detail.message;
          });
          setErrors(serverErrors);
          toast.error("Please check the form for errors");
        } else {
          toast.error(data.error || "Registration failed. Please try again.");
        }
      }
    } catch (error) {
      console.error("Registration error:", error);
      toast.error("Network error. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const updateFormData = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <form onSubmit={handleSubmit}>
        <div className="flex flex-col gap-6">
          <div className="flex flex-col items-center gap-2">
            <a
              href="/"
              className="flex flex-col items-center gap-2 font-medium"
            >
              <div className="flex items-center justify-center rounded-md">
                <Image src="/1.png" alt="Natives Forum" width={100} height={100} className="w-22 h-22" />
              </div>
              <span className="sr-only">Natives Forum</span>
            </a>
            <h1 className="text-xl font-bold">Welcome to Natives Forum.</h1>
            <div className="text-center text-sm">
              Already have an account?{" "}
              <a href="/signin" className="underline underline-offset-4">
                Sign in
              </a>
            </div>
          </div>
          
          <div className="flex flex-col gap-6">
            {/* Personal Information */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="grid gap-3">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  type="text"
                  placeholder="John"
                  required
                  className="rounded-none"
                  value={formData.firstName}
                  onChange={(e) => updateFormData("firstName", e.target.value)}
                />
                {errors.firstName && (
                  <p className="text-sm text-red-500">{errors.firstName}</p>
                )}
              </div>
              <div className="grid gap-3">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  type="text"
                  placeholder="Doe"
                  required
                  className="rounded-none"
                  value={formData.lastName}
                  onChange={(e) => updateFormData("lastName", e.target.value)}
                />
                {errors.lastName && (
                  <p className="text-sm text-red-500">{errors.lastName}</p>
                )}
              </div>
            </div>
            
            <div className="grid gap-3">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                required
                className="rounded-none"
                value={formData.email}
                onChange={(e) => updateFormData("email", e.target.value)}
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email}</p>
              )}
            </div>

            <div className="grid gap-3">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password (min 8 characters)"
                required
                className="rounded-none"
                value={formData.password}
                onChange={(e) => updateFormData("password", e.target.value)}
              />
              {errors.password && (
                <p className="text-sm text-red-500">{errors.password}</p>
              )}
            </div>

            {/* Sex Selection */}
            <div className="grid gap-3">
              <Label>Sex *</Label>
              <RadioGroup 
                value={formData.sex}
                onValueChange={(value) => updateFormData("sex", value)}
                className="flex gap-6"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="male" id="male" />
                  <Label htmlFor="male">Male</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="female" id="female" />
                  <Label htmlFor="female">Female</Label>
                </div>
              </RadioGroup>
              {errors.sex && (
                <p className="text-sm text-red-500">{errors.sex}</p>
              )}
            </div>

            {/* Province Selection */}
            <div className="grid gap-3">
              <Label htmlFor="province">Province *</Label>
              <Select value={formData.province} onValueChange={(value) => updateFormData("province", value)}>
                <SelectTrigger className="rounded-none">
                  <SelectValue placeholder="Select your province" />
                </SelectTrigger>
                <SelectContent className="rounded-none">
                  <SelectItem className="rounded-none" value="eastern-cape">Eastern Cape</SelectItem>
                  <SelectItem className="rounded-none" value="free-state">Free State</SelectItem>
                  <SelectItem className="rounded-none" value="gauteng">Gauteng</SelectItem>
                  <SelectItem className="rounded-none" value="kwazulu-natal">KwaZulu-Natal</SelectItem>
                  <SelectItem className="rounded-none" value="limpopo">Limpopo</SelectItem>
                  <SelectItem className="rounded-none" value="mpumalanga">Mpumalanga</SelectItem>
                  <SelectItem className="rounded-none" value="northern-cape">Northern Cape</SelectItem>
                  <SelectItem className="rounded-none" value="north-west">North West</SelectItem>
                  <SelectItem className="rounded-none" value="western-cape">Western Cape</SelectItem>
                </SelectContent>
              </Select>
              {errors.province && (
                <p className="text-sm text-red-500">{errors.province}</p>
              )}
            </div>

            {/* South African Native Status (Required) */}
            <div className="grid gap-3">
              <Label className="text-sm font-medium">
                Are you a South African native? <span className="text-red-500">*</span>
              </Label>
              <RadioGroup 
                value={formData.isSouthAfricanNative === null ? "" : formData.isSouthAfricanNative.toString()}
                onValueChange={(value) => updateFormData("isSouthAfricanNative", value === "true")}
                className="flex gap-6"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="true" id="native-yes" />
                  <Label htmlFor="native-yes">Yes</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="false" id="native-no" />
                  <Label htmlFor="native-no">No</Label>
                </div>
              </RadioGroup>
              {errors.isSouthAfricanNative && (
                <p className="text-sm text-red-500">{errors.isSouthAfricanNative}</p>
              )}
              <p className="text-xs text-muted-foreground">
                This platform is designed specifically for South African natives to build consensus on community empowerment.
              </p>
            </div>

            {/* Volunteer Willingness */}
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="volunteer"
                checked={formData.willingToVolunteer}
                onCheckedChange={(checked) => updateFormData("willingToVolunteer", checked)}
              />
              <Label
                htmlFor="volunteer"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                I am willing to volunteer for community initiatives
              </Label>
            </div>

            <Button 
              type="submit" 
              className="w-full rounded-none"
              disabled={isLoading}
            >
              {isLoading ? "Creating Account..." : "Create Account"}
            </Button>
          </div>
        </div>
      </form>
      
      <div className="text-muted-foreground text-center text-xs text-balance">
        By clicking continue, you agree to our{" "}
        <a href="#" className="underline underline-offset-4 hover:text-primary">
          Terms of Service
        </a>{" "}
        and{" "}
        <a href="#" className="underline underline-offset-4 hover:text-primary">
          Privacy Policy
        </a>.
      </div>
    </div>
  )
}