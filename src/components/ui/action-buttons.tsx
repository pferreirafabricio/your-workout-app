import { forwardRef, type ReactNode } from "react";
import { ArrowLeft, PencilLine, Plus, Save, Send, Trash2, X } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";

type ActionButtonProps = ButtonProps & {
  isLoading?: boolean;
  loadingText?: string;
  children?: ReactNode;
};

const SaveButton = forwardRef<HTMLButtonElement, ActionButtonProps>(
  ({ isLoading = false, loadingText = "Saving...", children = "Save", disabled, ...props }, ref) => (
    <Button ref={ref} disabled={disabled || isLoading} {...props}>
      <Save className="h-4 w-4" />
      {isLoading ? loadingText : children}
    </Button>
  ),
);
SaveButton.displayName = "SaveButton";

const AddButton = forwardRef<HTMLButtonElement, ActionButtonProps>(
  ({ isLoading = false, loadingText = "Adding...", children = "Add", disabled, ...props }, ref) => (
    <Button ref={ref} disabled={disabled || isLoading} {...props}>
      <Plus className="h-4 w-4" />
      {isLoading ? loadingText : children}
    </Button>
  ),
);
AddButton.displayName = "AddButton";

type DeleteButtonProps = ActionButtonProps & {
  iconOnly?: boolean;
};

const DeleteButton = forwardRef<HTMLButtonElement, DeleteButtonProps>(
  ({ iconOnly = false, isLoading = false, loadingText = "Deleting...", children = "Delete", disabled, ...props }, ref) => {
    if (iconOnly) {
      return (
        <Button
          ref={ref}
          disabled={disabled || isLoading}
          aria-label={typeof children === "string" ? children : "Delete"}
          {...props}>
          <Trash2 className="h-4 w-4" />
        </Button>
      );
    }

    return (
      <Button ref={ref} disabled={disabled || isLoading} {...props}>
        <Trash2 className="h-4 w-4" />
        {isLoading ? loadingText : children}
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
      <Button ref={ref} variant={variant} size={size} className={className} {...props}>
        <PencilLine className="h-4 w-4" />
        {children}
      </Button>
    );
  },
);
EditButton.displayName = "EditButton";

type SubmitButtonProps = ActionButtonProps & {
  icon?: "send" | "save";
};

const SubmitButton = forwardRef<HTMLButtonElement, SubmitButtonProps>(
  ({ icon = "send", isLoading = false, loadingText = "Submitting...", children = "Submit", disabled, ...props }, ref) => {
    const Icon = icon === "save" ? Save : Send;

    return (
      <Button ref={ref} type="submit" disabled={disabled || isLoading} {...props}>
        <Icon className="h-4 w-4" />
        {isLoading ? loadingText : children}
      </Button>
    );
  },
);
SubmitButton.displayName = "SubmitButton";

const CancelButton = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children = "Cancel", ...props }, ref) => (
    <Button ref={ref} {...props}>
      <X className="h-4 w-4" />
      {children}
    </Button>
  ),
);
CancelButton.displayName = "CancelButton";

const BackButton = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children = "Back", ...props }, ref) => (
    <Button ref={ref} {...props}>
      <ArrowLeft className="h-4 w-4" />
      {children}
    </Button>
  ),
);
BackButton.displayName = "BackButton";

export { AddButton, BackButton, CancelButton, DeleteButton, EditButton, SaveButton, SubmitButton };
export type { ActionButtonProps };
