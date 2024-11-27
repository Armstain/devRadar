"use client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-hot-toast";
import axios from 'axios';
import { useQueryClient } from "@tanstack/react-query";

interface ApplicationFormValues {
  company: string;
  position: string;
  status: string;
  link: string;
  notes: string;
}

export function ApplicationDialog() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  
  const form = useForm<ApplicationFormValues>({
    defaultValues: {
      company: "",
      position: "",
      status: "",
      link: "",
      notes: "",
    },
  });

  const onSubmit = async (data: ApplicationFormValues) => {
    try {
      const response = await axios.post('/api/applications', data);
      
      if (response.status === 200) {
        // Invalidate and refetch applications
        await queryClient.invalidateQueries({ queryKey: ['applications'] });
        
        const statusMessages = {
          'applied': '🚀 Application submitted successfully!',
          'in-progress': '📝 Application marked as in progress',
          'offer': '🎉 Congratulations on the offer!',
          'rejected': '💪 Keep going! More opportunities ahead'
        };

        const message = statusMessages[data.status as keyof typeof statusMessages] || 'Application saved successfully';
        
        toast(message, {
          style: {
            background: data.status === 'offer' ? '#10B981' : '#1E293B',
            color: '#fff',
            padding: '16px',
            borderRadius: '8px',
          },
          duration: 3000,
        });

        setOpen(false);
        form.reset();
      }
    } catch (error) {
      console.error("Error submitting application:", error);
      toast.error("Failed to submit application. Please try again.");
    }
  };

  const onClose = () => {
    setOpen(false);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Application
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Application</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
          <div className="grid gap-2">
            <label htmlFor="company">Company</label>
            <Input 
              {...form.register("company", { required: true })}
              id="company" 
              placeholder="Company name" 
            />
          </div>
          <div className="grid gap-2">
            <label htmlFor="position">Position</label>
            <Input 
              {...form.register("position", { required: true })}
              id="position" 
              placeholder="Job title" 
            />
          </div>
          <div className="grid gap-2">
            <label htmlFor="status">Status</label>
            <Select onValueChange={(value) => form.setValue("status", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="applied">Applied</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="offer">Offer</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <label htmlFor="link">Job Link</label>
            <Input 
              {...form.register("link")}
              id="link" 
              placeholder="URL to job posting" 
            />
          </div>
          <div className="grid gap-2">
            <label htmlFor="notes">Notes</label>
            <Textarea 
              {...form.register("notes")}
              id="notes" 
              placeholder="Add any notes about the application" 
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" onClick={onClose} variant="outline">Cancel</Button>
            <Button type="submit">Save</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}