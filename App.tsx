import React, { Suspense } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { DashboardLayout } from './layouts/DashboardLayout';
import { RoutePath } from './types';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { ThemeProvider } from './context/ThemeContext';

function lazyNamed<T extends React.ComponentType<any>>(
  loader: () => Promise<Record<string, any>>,
  name: string
) {
  return React.lazy(() => loader().then((m) => ({ default: m[name] as T })));
}

const SignIn = lazyNamed(() => import('./pages/auth/SignIn'), 'SignIn');
const SignUp = lazyNamed(() => import('./pages/auth/SignUp'), 'SignUp');
const ForgotPassword = lazyNamed(() => import('./pages/auth/ForgotPassword'), 'ForgotPassword');
const ResetPassword = lazyNamed(() => import('./pages/auth/ResetPassword'), 'ResetPassword');
const Home = lazyNamed(() => import('./pages/dashboard/Home'), 'Home');
const MyNotes = lazyNamed(() => import('./pages/dashboard/MyNotes'), 'MyNotes');
const CreateNote = lazyNamed(() => import('./pages/dashboard/CreateNote'), 'CreateNote');
const SingleNote = lazyNamed(() => import('./pages/dashboard/SingleNote'), 'SingleNote');
const Account = lazyNamed(() => import('./pages/dashboard/Account'), 'Account');
const Settings = lazyNamed(() => import('./pages/dashboard/Settings'), 'Settings');
const ITDashboard = lazyNamed(() => import('./pages/dashboard/ITDashboard'), 'ITDashboard');
const VendorList = lazyNamed(() => import('./pages/dashboard/VendorList'), 'VendorList');
const CreateInvoice = lazyNamed(() => import('./pages/dashboard/CreateInvoice'), 'CreateInvoice');
const InvoicesList = lazyNamed(() => import('./pages/dashboard/InvoicesList'), 'InvoicesList');
const MailAssistant = lazyNamed(() => import('./pages/dashboard/MailAssistant'), 'MailAssistant');

const RouteFallback: React.FC = () => (
  <div className="min-h-[60vh] flex items-center justify-center">
    <div className="h-7 w-7 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
  </div>
);

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Suspense fallback={<RouteFallback />}>
            <Routes>
              {/* Public Auth Routes */}
              <Route path={RoutePath.LOGIN} element={<SignIn />} />
              <Route path={RoutePath.SIGNUP} element={<SignUp />} />
              <Route path={RoutePath.FORGOT_PASSWORD} element={<ForgotPassword />} />
              <Route path={RoutePath.RESET_PASSWORD} element={<ResetPassword />} />

              {/* Dashboard Layout (Shared by Guest and Auth users) */}
              <Route element={<ErrorBoundary><DashboardLayout /></ErrorBoundary>}>
                {/* Public Home Page (Handles both Guest and Auth states internally) */}
                <Route path={RoutePath.HOME} element={<Home />} />
                
                <Route path="/public/notes/:id" element={<SingleNote />} />

                {/* Protected Routes - Redirect to Login if Guest */}
                <Route path={RoutePath.NOTES} element={<ProtectedRoute><MyNotes /></ProtectedRoute>} />
                <Route path={RoutePath.IT_DASHBOARD} element={<ProtectedRoute><ITDashboard /></ProtectedRoute>} />
                <Route path={RoutePath.VENDORS} element={<ProtectedRoute><VendorList /></ProtectedRoute>} />
                <Route path={RoutePath.INVOICES} element={<ProtectedRoute><InvoicesList /></ProtectedRoute>} />
                <Route path={RoutePath.MAIL_ASSISTANT} element={<ProtectedRoute><MailAssistant /></ProtectedRoute>} />
                <Route path={RoutePath.CREATE_INVOICE} element={<ProtectedRoute><CreateInvoice /></ProtectedRoute>} />
                <Route path={RoutePath.EDIT_INVOICE} element={<ProtectedRoute><CreateInvoice /></ProtectedRoute>} />
                <Route path={RoutePath.CREATE_NOTE} element={<ProtectedRoute><CreateNote /></ProtectedRoute>} />
                <Route path={RoutePath.EDIT_NOTE} element={<ProtectedRoute><CreateNote /></ProtectedRoute>} />
                <Route path={RoutePath.NOTE_DETAIL} element={<ProtectedRoute><SingleNote /></ProtectedRoute>} />
                <Route path={RoutePath.ACCOUNT} element={<ProtectedRoute><Account /></ProtectedRoute>} />
                <Route path={RoutePath.SETTINGS} element={<ProtectedRoute><Settings /></ProtectedRoute>} />
              </Route>

              {/* Fallback */}
              <Route path="*" element={<Navigate to={RoutePath.HOME} replace />} />
            </Routes>
          </Suspense>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;