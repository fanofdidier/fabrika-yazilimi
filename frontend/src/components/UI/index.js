// UI Components Index
// This file exports all UI components for easy importing

import Button from './Button';
import Card from './Card';
import Modal from './Modal';
import Table from './Table';
import Alert from './Alert';
import Badge from './Badge';
import LoadingSpinner from './LoadingSpinner';
import Form from './Form';

// Core Components
export { default as Button, IconButton, ButtonGroup, FloatingActionButton, SocialButton } from './Button';
export { default as Card } from './Card';
export { default as Modal, ModalHeader, ModalBody, ModalFooter, ConfirmationModal, AlertModal, Drawer } from './Modal';
export { default as Table, TableHeader, TableBody, TableRow, TableHeaderCell, TableCell, Pagination } from './Table';
export { default as Alert, Toast, ToastContainer, Banner } from './Alert';
export { default as Badge, DotBadge, StatusBadge, PriorityBadge } from './Badge';

// Form Components
export { default as Form } from './Form';
export {
  Input,
  Textarea,
  Select,
  Checkbox,
  Radio,
  RadioGroup,
  Switch,
  FormGroup,
  FormRow
} from './Form';

// Loading Component
export { default as LoadingSpinner } from './LoadingSpinner';
export {
  ButtonSpinner,
  InlineSpinner,
  OverlaySpinner,
  PageSpinner,
  CardSkeleton,
  TableSkeleton,
  SkeletonLoader,
  ProgressSpinner
} from './LoadingSpinner';

// Default export with main components
const UIComponents = {
  Button,
  Card,
  Modal,
  Table,
  Alert,
  Badge,
  LoadingSpinner
};

export default UIComponents;