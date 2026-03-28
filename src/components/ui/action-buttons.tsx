import { forwardRef, type ReactNode } from "react";
import { ArrowLeft, Loader2, PencilLine, Plus, Save, Send, Trash2, X } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/shared/utils";

type ActionButtonProps = ButtonProps & {
  isLoading?: boolean;
  loadingText?: string;
  children?: ReactNode;
};

const ACTION_BUTTON_CN = "min-w-[120px] justify-center";

const SaveButton = forwardRef<HTMLButtonElement, ActionButtonProps>(
  ({ isLoading = false, loadingText = "Loading...", children = "Save", disabled, className, ...props }, ref) => (
    <Button ref={ref} disabled={disabled || isLoading} className={cn(ACTION_BUTTON_CN, className)} {...props}>
      {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
      <span>{isLoading ? loadingText : children}</span>
    </Button>
  ),
);
SaveButton.displayName = "SaveButton";

const AddButton = forwardRef<HTMLButtonElement, ActionButtonProps>(
  ({ isLoading = false, loadingText = "Loading...", children = "Add", disabled, className, ...props }, ref) => (
    <Button ref={ref} disabled={disabled || isLoading} className={cn(ACTION_BUTTON_CN, className)} {...props}>
      {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
      <span>{isLoading ? loadingText : children}</span>
    </Button>
  ),
);
AddButton.displayName = "AddButton";

type DeleteButtonProps = ActionButtonProps & {
  iconOnly?: boolean;
};

const DeleteButton = forwardRef<HTMLButtonElement, DeleteButtonProps>(
  ({ iconOnly = false, isLoading = false, loadingText = "Deleting...", children = "Delete", disabled, className, ...props }, ref) => {
    if (iconOnly) {
      return (
        <Button
          ref={ref}
          disabled={disabled || isLoading}
          className={className}
          aria-label={typeof children === "string" ? children : "Delete"}
          {...props}>
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
        </Button>
      );
    }

    return (
      <Button ref={ref} disabled={disabled || isLoading} className={cn(ACTION_BUTTON_CN, className)} {...props}>
        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
        <span>{isLoading ? loadingText : children}</span>
      </Button>
    );
  },
);
DeleteButton.displayName = "DeleteButton";

type EditButtonProps = ButtonProps & {
  iconOnly?: boolean;
};

const EditButton = forwardRef<HTMLButtonElement, EditButtonProps>(
  ({ iconOnly = true, children = "Edit", className, variant, size, ...props }, ref) => {
    if (iconOnly) {
      return (
        <Button
          ref={ref}
          variant={variant ?? "ghost"}
          size={size ?? "icon"}
          className={className}
          aria-label={typeof children === "string" ? children : "Edit"}
          {...props}>
          <PencilLine className="h-4 w-4" />
        </Button>
      );
    }

    return (
      <Button ref={ref} variant={variant} size={size} className={cn(ACTION_BUTTON_CN, className)} {...props}>
        <PencilLine className="h-4 w-4" />
        <span>{children}</span>
      </Button>
    );
  },
);
EditButton.displayName = "EditButton";

type SubmitButtonProps = ActionButtonProps & {
  icon?: "send" | "save";
};

const SubmitButton = forwardRef<HTMLButtonElement, SubmitButtonProps>(
  ({ icon = "send", isLoading = false, loadingText = "Loading...", children = "Submit", disabled, className, ...props }, ref) => {
    const Icon = icon === "save" ? Save : Send;

    return (
      <Button ref={ref} type="submit" disabled={disabled || isLoading} className={cn(ACTION_BUTTON_CN, className)} {...props}>
        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Icon className="h-4 w-4" />}
        <span>{isLoading ? loadingText : children}</span>
      </Button>
    );
  },
);
SubmitButton.displayName = "SubmitButton";

const CancelButton = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children = "Cancel", className, ...props }, ref) => (
    <Button ref={ref} className={cn(ACTION_BUTTON_CN, className)} {...props}>
      <X className="h-4 w-4" />
      <span>{children}</span>
    </Button>
  ),
);
CancelButton.displayName = "CancelButton";

const BackButton = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children = "Back", className, ...props }, ref) => (
    <Button ref={ref} className={cn(ACTION_BUTTON_CN, className)} {...props}>
      <ArrowLeft className="h-4 w-4" />
      <span>{children}</span>
    </Button>
  ),
);
BackButton.displayName = "BackButton";


export { AddButton, BackButton, CancelButton, DeleteButton, EditButton, SaveButton, SubmitButton };
export type { ActionButtonProps };
