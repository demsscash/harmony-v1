'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api, { API_BASE_URL } from '@/lib/api';
import Cookies from 'js-cookie';
import { useAuthStore } from '@/store/authStore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Loader2, ArrowLeft, Mail, Phone, Calendar, Briefcase, History, FileText, Banknote, Plane, UserIcon, CheckCircle2, Key, ListTodo, Edit, Award, Percent, Tag, Clock, AlertTriangle, UserX, RotateCcw, Plus, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import Link from 'next/link';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useTranslations } from 'next-intl';

const EVENT_ICONS: Record<string, any> = { HIRED: CheckCircle2, PROFILE_UPDATED: UserIcon, TERMINATED: UserX, REINSTATED: RotateCcw, SANCTION: AlertTriangle };
const EVENT_COLORS: Record<string, string> = { HIRED: 'text-green-600', PROFILE_UPDATED: 'text-blue-600', TERMINATED: 'text-red-600', REINSTATED: 'text-emerald-600', SANCTION: 'text-orange-600' };

export default function EmployeeProfile() {
    const t = useTranslations('employees');
    const tc = useTranslations('common');
    const params = useParams();
    const router = useRouter();
    const { user: authUser } = useAuthStore();
    const employeeId = params?.id as string;
    const [employee, setEmployee] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('TIMELINE');
    const [onboardingTasks, setOnboardingTasks] = useState<any[]>([]);
    const [onboardingTemplates, setOnboardingTemplates] = useState<any[]>([]);
    const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
    const [applyingTemplate, setApplyingTemplate] = useState(false);
    const [leaveBalances, setLeaveBalances] = useState<any[]>([]);
    const [initializingBalances, setInitializingBalances] = useState(false);
    const currentYear = new Date().getFullYear();

    const tt = useTranslations('termination');

    // Termination state
    const [showTermDialog, setShowTermDialog] = useState(false);
    const [termForm, setTermForm] = useState({ terminationDate: new Date().toISOString().split('T')[0], terminationReason: '', terminationNotes: '' });
    const [terminating, setTerminating] = useState(false);
    const [reinstating, setReinstating] = useState(false);

    const handleTerminate = async () => {
        if (!termForm.terminationDate || !termForm.terminationReason) return;
        setTerminating(true);
        try {
            await api.post(`/employees/${employeeId}/terminate`, termForm);
            toast.success(tt('terminateSuccess'));
            setShowTermDialog(false);
            fetchProfileData();
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Erreur');
        } finally { setTerminating(false); }
    };

    const handleReinstate = async () => {
        setReinstating(true);
        try {
            await api.post(`/employees/${employeeId}/reinstate`);
            toast.success(tt('reinstateSuccess'));
            fetchProfileData();
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Erreur');
        } finally { setReinstating(false); }
    };

    const fetchProfileData = () => {
        setIsLoading(true);
        Promise.all([
            api.get(`/employees/${employeeId}`).catch(() => null),
            api.get(`/onboarding/templates`).catch(() => null),
            api.get(`/employees/${employeeId}/onboarding`).catch(() => null),
            api.get(`/leaves/balances/${employeeId}?year=${currentYear}`).catch(() => null)
        ]).then(([empRes, tplRes, tasksRes, balancesRes]) => {
            if (empRes?.data?.success) setEmployee(empRes.data.data);
            if (tplRes?.data?.success) setOnboardingTemplates(tplRes.data.data);
            if (tasksRes?.data?.success) setOnboardingTasks(tasksRes.data.data);
            if (balancesRes?.data?.success) setLeaveBalances(balancesRes.data.data || []);
        }).catch(() => {
            toast.error(t('loadErrorGeneric'));
            router.push('/dashboard/employees');
        }).finally(() => setIsLoading(false));
    };

    useEffect(() => {
        if (!employeeId) return;
        fetchProfileData();
    }, [employeeId, router]);

    if (isLoading) return (
        <div className="flex h-96 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
    );

    if (!employee) return <p className="p-6 text-center text-gray-500">{t('notFound')}</p>;

    const tabs = [
        { id: 'TIMELINE', label: t('timeline'), icon: History },
        { id: 'DOCUMENTS', label: t('documents'), icon: FileText },
        { id: 'PAYROLL', label: t('payroll'), icon: Banknote },
        { id: 'LEAVES', label: t('leavesTab'), icon: Plane },
        { id: 'ADVANTAGES', label: t('advantages'), icon: Award },
        { id: 'ATTENDANCE', label: t('attendanceTab'), icon: Clock },
        { id: 'SANCTIONS', label: t('sanctions'), icon: AlertTriangle },
        { id: 'ONBOARDING', label: t('onboarding'), icon: ListTodo },
        { id: 'ACCESS', label: t('access'), icon: Key },
    ];

    const handleCreateAccess = async () => {
        const password = window.prompt(t('tempPasswordPrompt'));
        if (!password || password.length < 6) {
            toast.error(t('invalidPassword'));
            return;
        }

        try {
            const res = await api.post(`/employees/${employeeId}/create-account`, { password });
            if (res.data.success) {
                toast.success(t('accessCreated'));
                // Refresh employee to show the active account
                setEmployee({ ...employee, user: res.data.data });
            }
        } catch (error: any) {
            toast.error(error.response?.data?.error || t('accessCreateError'));
        }
    };

    const handleApplyTemplate = async () => {
        if (!selectedTemplateId) return toast.error(t('selectTemplateError'));
        setApplyingTemplate(true);
        try {
            await api.post(`/employees/${employeeId}/onboarding/apply-template`, { templateId: selectedTemplateId });
            toast.success(t('checklistApplied'));
            fetchProfileData(); // Reload tasks
        } catch (error: any) {
            toast.error(error.response?.data?.error || t('applyError'));
        } finally {
            setApplyingTemplate(false);
        }
    };

    const toggleTaskCompletion = async (taskId: string, isCompleted: boolean) => {
        try {
            // Optimistic update
            setOnboardingTasks(prev => prev.map(t => t.id === taskId ? { ...t, isCompleted } : t));
            await api.put(`/employees/${employeeId}/onboarding/${taskId}`, { isCompleted });
        } catch (error: any) {
            toast.error(t('syncError'));
            fetchProfileData(); // revert
        }
    };

    const handleInitializeBalances = async () => {
        setInitializingBalances(true);
        try {
            const res = await api.post('/leaves/balances/initialize', { employeeId, year: currentYear });
            if (res.data.success) {
                toast.success(t('balancesInitializedSuccess', { year: currentYear }));
                const balancesRes = await api.get(`/leaves/balances/${employeeId}?year=${currentYear}`).catch(() => null);
                if (balancesRes?.data?.success) setLeaveBalances(balancesRes.data.data || []);
            }
        } catch (error: any) {
            toast.error(error.response?.data?.error || t('balancesInitError'));
        } finally {
            setInitializingBalances(false);
        }
    };

    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/employees">
                        <Button variant="outline" size="icon" className="h-8 w-8"><ArrowLeft className="h-4 w-4" /></Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">{t('profile')}</h1>
                        <p className="text-gray-500">{employee.firstName} {employee.lastName}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {employee.status === 'TERMINATED' ? (
                        <Button variant="outline" onClick={handleReinstate} disabled={reinstating} className="gap-2 border-emerald-300 text-emerald-700 hover:bg-emerald-50">
                            {reinstating ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
                            <span>{tt('reinstate')}</span>
                        </Button>
                    ) : (
                        <Button variant="outline" onClick={() => setShowTermDialog(true)} className="gap-2 border-red-200 text-red-600 hover:bg-red-50">
                            <UserX className="h-4 w-4" />
                            <span>{tt('terminate')}</span>
                        </Button>
                    )}
                    <Link href={`/dashboard/employees/${employee.id}/edit`}>
                        <Button variant="outline" className="gap-2 border-slate-300 text-slate-700 hover:bg-slate-50">
                            <Edit className="h-4 w-4" />
                            <span>{t('editProfile')}</span>
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Termination banner */}
            {employee.status === 'TERMINATED' && (
                <div className="flex items-center gap-4 p-4 bg-red-50 border border-red-200 rounded-xl">
                    <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                        <UserX className="h-5 w-5 text-red-600" />
                    </div>
                    <div className="flex-1">
                        <p className="font-bold text-red-800">{tt('terminated')}</p>
                        <p className="text-sm text-red-600">
                            {employee.terminationDate && tt('terminatedOn', { date: new Date(employee.terminationDate).toLocaleDateString('fr-FR') })}
                            {employee.terminationReason && ` — ${tt(`reasons.${employee.terminationReason}`)}`}
                        </p>
                        {employee.terminationNotes && <p className="text-xs text-red-500 mt-1">{employee.terminationNotes}</p>}
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Panneau gauche */}
                <Card className={`border-t-4 ${employee.status === 'TERMINATED' ? 'border-t-red-500' : 'border-t-blue-600'} overflow-hidden`}>
                    <CardContent className="pt-6">
                        <div className="flex flex-col items-center text-center mb-6">
                            {employee.photo ? (
                                <img src={employee.photo} alt={`${employee.firstName} ${employee.lastName}`} className="h-24 w-24 rounded-full object-cover border-2 border-blue-200 shadow-sm mb-4" />
                            ) : (
                                <div className="h-24 w-24 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-3xl font-bold uppercase mb-4">
                                    {employee.firstName[0]}{employee.lastName[0]}
                                </div>
                            )}
                            <h2 className="text-xl font-bold">{employee.firstName} {employee.lastName}</h2>
                            <p className="text-gray-500 mb-2">{employee.position}</p>
                            <span className={`px-3 py-1 text-xs font-semibold rounded-full ${employee.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                {employee.status}
                            </span>
                        </div>

                        <div className="border-t pt-4 space-y-4">
                            {[
                                { icon: Briefcase, label: t('department'), val: employee.department?.name || tc('notAssigned') },
                                { icon: Mail, label: tc('email'), val: employee.email || tc('na') },
                                { icon: Phone, label: tc('phone'), val: employee.phone || tc('na') },
                                { icon: Calendar, label: t('hireDate'), val: new Date(employee.hireDate).toLocaleDateString('fr-FR') },
                            ].map(({ icon: Icon, label, val }) => (
                                <div key={label} className="flex items-start gap-3 text-sm">
                                    <Icon className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                                    <div><p className="font-medium text-gray-700">{label}</p><p className="text-gray-500">{val}</p></div>
                                </div>
                            ))}
                            <div className="flex items-start gap-3 text-sm">
                                <UserIcon className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                                <div>
                                    <p className="font-medium text-gray-700">{t('matricule')}</p>
                                    <p className="font-mono bg-gray-100 px-2 py-0.5 rounded text-gray-600 text-xs inline-block">{employee.matricule}</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Panneau droit */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg border">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium rounded-md transition-all ${activeTab === tab.id ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                <tab.icon className="h-3.5 w-3.5" />{tab.label}
                            </button>
                        ))}
                    </div>

                    {activeTab === 'TIMELINE' && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base"><History className="h-4 w-4" />{t('eventHistory')}</CardTitle>
                                <CardDescription>{t('eventHistoryDesc')}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {employee.timeline?.length > 0 ? (
                                    <div className="relative pl-6 border-l-2 border-gray-100 space-y-6">
                                        {employee.timeline.map((ev: any) => {
                                            const Icon = EVENT_ICONS[ev.event] || History;
                                            const color = EVENT_COLORS[ev.event] || 'text-gray-500';
                                            return (
                                                <div key={ev.id} className="relative">
                                                    <div className="absolute -left-[29px] bg-white p-1 rounded-full border-2 border-blue-100">
                                                        <div className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                                                    </div>
                                                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                                                        <div className="flex justify-between items-center mb-1">
                                                            <h4 className={`font-semibold text-sm flex items-center gap-2 ${color}`}>
                                                                <Icon className="h-4 w-4" />{ev.event}
                                                            </h4>
                                                            <span className="text-xs text-gray-400">
                                                                {new Date(ev.createdAt).toLocaleDateString('fr-FR')} à {new Date(ev.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                                            </span>
                                                        </div>
                                                        <p className="text-sm text-gray-600">{ev.description}</p>
                                                        {ev.oldValue && ev.newValue && (
                                                            <p className="mt-1 text-xs text-gray-400">
                                                                <span className="line-through text-red-400 mr-1">{ev.oldValue}</span>
                                                                → <span className="text-green-600 font-medium ml-1">{ev.newValue}</span>
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-400 italic text-center py-8">{t('noEvents')}</p>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {activeTab === 'ONBOARDING' && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base"><ListTodo className="h-4 w-4" />{t('integrationChecklist')}</CardTitle>
                                <CardDescription>{t('integrationChecklistDesc')}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {onboardingTasks.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center p-8 border border-dashed rounded-lg bg-slate-50">
                                        <ListTodo className="h-10 w-10 text-slate-300 mb-3" />
                                        <h3 className="font-semibold text-slate-700 mb-1">{t('noTasksAssigned')}</h3>
                                        <p className="text-sm text-slate-500 mb-4 text-center max-w-sm">
                                            {t('noChecklistDesc')}
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <Select value={selectedTemplateId} onValueChange={(val) => setSelectedTemplateId(val || '')}>
                                                <SelectTrigger className="w-[250px] bg-white">
                                                    <SelectValue placeholder={t('chooseTemplate')} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {onboardingTemplates.map(tpl => (
                                                        <SelectItem key={tpl.id} value={tpl.id}>{tpl.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <Button onClick={handleApplyTemplate} disabled={applyingTemplate || !selectedTemplateId} className="bg-emerald-600 hover:bg-emerald-700">
                                                {applyingTemplate ? <Loader2 className="w-4 h-4 animate-spin" /> : t('apply')}
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border mb-4">
                                            <div className="space-y-1">
                                                <h4 className="font-semibold text-sm text-slate-800">{t('overallProgress')}</h4>
                                                <div className="w-64 h-2 bg-slate-200 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-emerald-500 transition-all duration-500"
                                                        style={{ width: `${(onboardingTasks.filter(t => t.isCompleted).length / onboardingTasks.length) * 100}%` }}
                                                    />
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-2xl font-bold text-emerald-600">
                                                    {Math.round((onboardingTasks.filter(t => t.isCompleted).length / onboardingTasks.length) * 100)}%
                                                </span>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            {onboardingTasks.map((task) => (
                                                <div key={task.id} className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${task.isCompleted ? 'bg-emerald-50 border-emerald-100' : 'bg-white hover:bg-slate-50'}`}>
                                                    <Switch
                                                        checked={task.isCompleted}
                                                        onCheckedChange={(checked) => toggleTaskCompletion(task.id, checked)}
                                                        className="mt-0.5 data-[state=checked]:bg-emerald-500"
                                                    />
                                                    <div>
                                                        <p className={`text-sm font-semibold ${task.isCompleted ? 'text-emerald-800 line-through opacity-70' : 'text-slate-800'}`}>
                                                            {task.title}
                                                        </p>
                                                        {task.description && (
                                                            <p className={`text-xs mt-0.5 ${task.isCompleted ? 'text-emerald-600/70' : 'text-slate-500'}`}>
                                                                {task.description}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {activeTab === 'DOCUMENTS' && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base"><FileText className="h-4 w-4" />{t('employeeDocuments')}</CardTitle>
                                <CardDescription>{t('employeeDocumentsDesc')}</CardDescription>
                            </CardHeader>
                            <CardContent className="grid sm:grid-cols-2 gap-4">
                                <Card className="border shadow-sm hover:shadow-md transition-shadow">
                                    <CardContent className="p-5 flex flex-col items-center justify-center text-center gap-3">
                                        <div className="h-12 w-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                                            <FileText className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-800">{t('employmentContract')}</h4>
                                            <p className="text-xs text-slate-500">{t('dynamicallyGenerated')}</p>
                                        </div>
                                        <Button
                                            variant="outline"
                                            className="w-full mt-2"
                                            onClick={() => {
                                                const url = `${API_BASE_URL}/employees/${employee.id}/contract?tenant=${authUser?.tenantSubdomain || 'demo'}&token=${Cookies.get('accessToken') || ''}`;
                                                window.open(url, '_blank');
                                            }}
                                        >
                                            {t('downloadPdf')}
                                        </Button>
                                    </CardContent>
                                </Card>

                                <Card className="border shadow-sm hover:shadow-md transition-shadow">
                                    <CardContent className="p-5 flex flex-col items-center justify-center text-center gap-3">
                                        <div className="h-12 w-12 rounded-full bg-purple-50 flex items-center justify-center text-purple-600">
                                            <UserIcon className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-800">{t('employeeBadge')}</h4>
                                            <p className="text-xs text-slate-500">{t('idCardFormat')}</p>
                                        </div>
                                        <Button
                                            variant="outline"
                                            className="w-full mt-2"
                                            onClick={() => {
                                                const url = `${API_BASE_URL}/employees/${employee.id}/badge?tenant=${authUser?.tenantSubdomain || 'demo'}&token=${Cookies.get('accessToken') || ''}`;
                                                window.open(url, '_blank');
                                            }}
                                        >
                                            {t('downloadBadgeBtn')}
                                        </Button>
                                    </CardContent>
                                </Card>
                            </CardContent>
                        </Card>
                    )}

                    {activeTab === 'LEAVES' && (<>
                        {/* Soldes de congés */}
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="flex items-center gap-2 text-base"><Plane className="h-4 w-4" />{t('leaveBalancesTitle', { year: currentYear })}</CardTitle>
                                        <CardDescription>{t('leaveBalancesDesc')}</CardDescription>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleInitializeBalances}
                                        disabled={initializingBalances}
                                        className="text-xs"
                                    >
                                        {initializingBalances ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : null}
                                        {t('initializeBalances', { year: currentYear })}
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {leaveBalances.length > 0 ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                        {leaveBalances.map((bal: any) => {
                                            const entitled = Number(bal.entitled || 0);
                                            const taken = Number(bal.taken || 0);
                                            const remaining = Number(bal.remaining ?? (entitled - taken));
                                            const pct = entitled > 0 ? (remaining / entitled) * 100 : 0;
                                            const color = pct > 50 ? 'emerald' : pct >= 20 ? 'amber' : 'red';
                                            return (
                                                <div key={bal.id || bal.leaveTypeCode} className="p-3 rounded-lg border bg-white">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">{bal.leaveType?.name || bal.leaveTypeCode}</span>
                                                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full bg-${color}-100 text-${color}-700`}>
                                                            {remaining}/{entitled}
                                                        </span>
                                                    </div>
                                                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full transition-all duration-500 ${color === 'emerald' ? 'bg-emerald-500' : color === 'amber' ? 'bg-amber-500' : 'bg-red-500'}`}
                                                            style={{ width: `${Math.min(pct, 100)}%` }}
                                                        />
                                                    </div>
                                                    <div className="flex justify-between mt-1.5 text-[10px] text-slate-400">
                                                        <span>{t('taken', { taken })}</span>
                                                        <span>{t('remaining', { remaining })}</span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-400 italic text-center py-4">{t('noBalancesEmployee')}</p>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base"><Plane className="h-4 w-4" />{t('leaveHistory')}</CardTitle>
                                <CardDescription>{t('leaveHistoryDesc')}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {employee.leaves?.length > 0 ? (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm text-left">
                                            <thead className="bg-slate-50 text-slate-500 border-b">
                                                <tr>
                                                    <th className="px-4 py-3 font-semibold">{t('type')}</th>
                                                    <th className="px-4 py-3 font-semibold">{t('period')}</th>
                                                    <th className="px-4 py-3 font-semibold">{tc('status')}</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {employee.leaves.map((leave: any) => (
                                                    <tr key={leave.id}>
                                                        <td className="px-4 py-3 font-medium text-slate-700">{leave.leaveType?.name || '—'}</td>
                                                        <td className="px-4 py-3 text-slate-600 text-xs">
                                                            {new Date(leave.startDate).toLocaleDateString('fr-FR')} → {new Date(leave.endDate).toLocaleDateString('fr-FR')}
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${leave.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' :
                                                                leave.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                                                                    'bg-amber-100 text-amber-700'
                                                                }`}>
                                                                {leave.status}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-400 italic text-center py-8">{t('noLeavesRecorded')}</p>
                                )}
                            </CardContent>
                        </Card>
                    </>)}

                    {activeTab === 'PAYROLL' && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base"><Banknote className="h-4 w-4" />{t('payslipsTitle')}</CardTitle>
                                <CardDescription>{t('payslipsDesc')}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {employee.payslips?.length > 0 ? (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm text-left">
                                            <thead className="bg-slate-50 text-slate-500 border-b">
                                                <tr>
                                                    <th className="px-4 py-3 font-semibold">{t('periodCol')}</th>
                                                    <th className="px-4 py-3 font-semibold">{t('baseSalaryCol')}</th>
                                                    <th className="px-4 py-3 font-semibold">{t('netPayCol')}</th>
                                                    <th className="px-4 py-3 font-semibold">{t('statusCol')}</th>
                                                    <th className="px-4 py-3 font-semibold text-right">{t('actionCol')}</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {employee.payslips.map((payroll: any) => (
                                                    <tr key={payroll.id}>
                                                        <td className="px-4 py-3 font-medium text-slate-700 whitespace-nowrap">
                                                            {payroll.payroll
                                                                ? new Date(payroll.payroll.year, payroll.payroll.month - 1).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })
                                                                : new Date(payroll.createdAt).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })}
                                                        </td>
                                                        <td className="px-4 py-3 text-slate-600">{Number(payroll.baseSalary).toLocaleString('fr-FR')} {employee.currency}</td>
                                                        <td className="px-4 py-3 font-bold text-slate-900">{Number(payroll.netSalary).toLocaleString('fr-FR')} {employee.currency}</td>
                                                        <td className="px-4 py-3">
                                                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${payroll.status === 'PAID' ? 'bg-emerald-100 text-emerald-700' :
                                                                'bg-blue-100 text-blue-700'
                                                                }`}>
                                                                {payroll.status}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3 text-right">
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                                onClick={() => {
                                                                    window.open(`${API_BASE_URL}/payrolls/payslips/${payroll.id}/pdf?tenant=${authUser?.tenantSubdomain || 'demo'}&token=${Cookies.get('accessToken') || ''}`, '_blank');
                                                                }}
                                                            >
                                                                PDF
                                                            </Button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-400 italic text-center py-8">{t('noPayslips')}</p>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {activeTab === 'ADVANTAGES' && (
                        <PrimesTab employeeId={employeeId} employee={employee} onRefresh={fetchProfileData} />
                    )}

                    {activeTab === 'ATTENDANCE' && (
                        <AttendanceTab employeeId={employeeId} />
                    )}

                    {activeTab === 'SANCTIONS' && (
                        <SanctionsTab employeeId={employeeId} />
                    )}

                    {activeTab === 'ACCESS' && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base"><Key className="h-4 w-4" />{t('portalAccess')}</CardTitle>
                                <CardDescription>{t('portalAccessDesc')}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {employee.user ? (
                                    <div className="flex items-center justify-between p-4 border rounded-lg bg-green-50 border-green-100">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-green-800">{t('activeAccount')}</span>
                                            <span className="text-sm text-green-600">{employee.user.email}</span>
                                        </div>
                                        <CheckCircle2 className="h-6 w-6 text-green-500" />
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center p-6 border border-dashed rounded-lg bg-slate-50 gap-4 text-center">
                                        <div className="h-12 w-12 rounded-full bg-slate-200 flex items-center justify-center text-slate-500">
                                            <Key className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-700">{t('noAccessGenerated')}</h4>
                                            <p className="text-sm text-slate-500 max-w-sm mx-auto mt-1">
                                                {t('noPortalAccessDesc')}
                                            </p>
                                        </div>
                                        <Button onClick={handleCreateAccess} className="mt-2 bg-slate-900 hover:bg-slate-800 text-white">
                                            <Key className="h-4 w-4 mr-2" />
                                            {t('generateAccess')}
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>

            {/* Termination Dialog */}
            <Dialog open={showTermDialog} onOpenChange={(open) => { if (!open) setShowTermDialog(false); }}>
                <DialogContent className="sm:max-w-[480px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-red-700">
                            <UserX className="h-5 w-5" /> {tt('terminateTitle')}
                        </DialogTitle>
                        <DialogDescription>{tt('terminateDesc')}</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label>{tt('terminationDate')} *</Label>
                                <Input type="date" value={termForm.terminationDate} onChange={e => setTermForm({ ...termForm, terminationDate: e.target.value })} required />
                            </div>
                            <div className="space-y-1.5">
                                <Label>{tt('terminationReason')} *</Label>
                                <select
                                    value={termForm.terminationReason}
                                    onChange={e => setTermForm({ ...termForm, terminationReason: e.target.value })}
                                    className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none shadow-sm"
                                    required
                                >
                                    <option value="">{tt('selectReason')}</option>
                                    {['RESIGNATION', 'DISMISSAL', 'MUTUAL_AGREEMENT', 'END_OF_CONTRACT', 'RETIREMENT', 'LAYOFF', 'ABANDONMENT', 'DEATH'].map(r => (
                                        <option key={r} value={r}>{tt(`reasons.${r}`)}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Label>{tt('terminationNotes')}</Label>
                            <textarea
                                value={termForm.terminationNotes}
                                onChange={e => setTermForm({ ...termForm, terminationNotes: e.target.value })}
                                placeholder={tt('terminationNotesPlaceholder')}
                                className="w-full min-h-[80px] rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none shadow-sm resize-none"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowTermDialog(false)}>{tc('cancel')}</Button>
                        <Button
                            variant="destructive"
                            onClick={handleTerminate}
                            disabled={terminating || !termForm.terminationDate || !termForm.terminationReason}
                        >
                            {terminating ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <UserX className="h-4 w-4 mr-1" />}
                            {tt('confirmTerminate')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

// =========================================
// ATTENDANCE TAB COMPONENT
// =========================================
function AttendanceTab({ employeeId }: { employeeId: string }) {
    const t = useTranslations('attendance');
    const [summary, setSummary] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const now = new Date();
    const [month, setMonth] = useState(now.getMonth() + 1);
    const [year, setYear] = useState(now.getFullYear());

    useEffect(() => {
        setLoading(true);
        api.get('/attendance/summary', { params: { employeeId, month, year } })
            .then(res => setSummary(res.data?.data || null))
            .catch(() => {})
            .finally(() => setLoading(false));
    }, [employeeId, month, year]);

    if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-blue-600" /></div>;

    const monthLabel = new Date(year, month - 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    const breakdown = summary?.breakdown || {};
    const codes = Object.entries(breakdown) as [string, { label: string; count: number; deducts: boolean }][];

    return (
        <Card>
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-sm flex items-center gap-2"><Clock className="h-4 w-4" /> {t('summary')} — {monthLabel}</CardTitle>
                    <div className="flex items-center gap-1">
                        <button onClick={() => { if (month === 1) { setMonth(12); setYear(y => y - 1); } else setMonth(m => m - 1); }} className="p-1 hover:bg-slate-100 rounded">&larr;</button>
                        <button onClick={() => { if (month === 12) { setMonth(1); setYear(y => y + 1); } else setMonth(m => m + 1); }} className="p-1 hover:bg-slate-100 rounded">&rarr;</button>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {codes.length > 0 ? (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            <div className="bg-slate-50 border rounded-xl p-3 text-center">
                                <p className="text-xs text-slate-500">{t('totalDays')}</p>
                                <p className="text-lg font-bold text-slate-800">{summary?.daysInMonth || 0}</p>
                            </div>
                            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-center">
                                <p className="text-xs text-slate-500">{t('daysWorked')}</p>
                                <p className="text-lg font-bold text-emerald-600">{summary?.totalEntries || 0}</p>
                            </div>
                            <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-center">
                                <p className="text-xs text-slate-500">{t('daysAbsent')}</p>
                                <p className="text-lg font-bold text-red-600">
                                    {codes.filter(([, v]) => v.deducts).reduce((sum, [, v]) => sum + v.count, 0)}
                                </p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            {codes.map(([code, data]) => (
                                <div key={code} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-lg">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold text-slate-600 bg-white px-2 py-0.5 rounded border">{code}</span>
                                        <span className="text-sm text-slate-700">{data.label}</span>
                                        {data.deducts && <span className="text-[10px] font-bold text-red-500 bg-red-50 px-1.5 py-0.5 rounded">DÉDUIT</span>}
                                    </div>
                                    <span className="text-sm font-bold text-slate-800">{data.count} jour(s)</span>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <p className="text-sm text-slate-400 italic text-center py-8">Aucun pointage enregistré ce mois</p>
                )}
            </CardContent>
        </Card>
    );
}

// =========================================
// SANCTIONS TAB COMPONENT
// =========================================
function SanctionsTab({ employeeId }: { employeeId: string }) {
    const t = useTranslations('sanctions');
    const tc = useTranslations('common');
    const [sanctions, setSanctions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/sanctions', { params: { employeeId } })
            .then(res => setSanctions(res.data?.data || []))
            .catch(() => {})
            .finally(() => setLoading(false));
    }, [employeeId]);

    const typeLabel = (type: string) => t(`types.${type}`) || type;
    const isFinancial = (type: string) => ['DEDUCTION_PRIME', 'RETENUE_SALAIRE'].includes(type);

    const TYPE_COLOR: Record<string, string> = {
        DEDUCTION_PRIME: 'bg-orange-100 text-orange-700',
        RETENUE_SALAIRE: 'bg-red-100 text-red-700',
        AVERTISSEMENT: 'bg-amber-100 text-amber-700',
        MISE_A_PIED: 'bg-purple-100 text-purple-700',
    };

    if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-blue-600" /></div>;

    const totalDeductions = sanctions.filter(s => s.status === 'ACTIVE' && isFinancial(s.type)).reduce((sum, s) => sum + Number(s.deductionAmount), 0);

    return (
        <div className="space-y-4">
            {totalDeductions > 0 && (
                <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-100 rounded-xl">
                    <AlertTriangle className="h-5 w-5 text-red-500 shrink-0" />
                    <div>
                        <p className="text-sm font-semibold text-red-700">{t('impactPayroll')}</p>
                        <p className="text-xs text-red-600">{t('totalAmount')}: {totalDeductions.toLocaleString()} MRU</p>
                    </div>
                </div>
            )}

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base"><AlertTriangle className="h-4 w-4" />{t('sanctionHistory')}</CardTitle>
                    <CardDescription>{t('sanctionHistoryDesc')}</CardDescription>
                </CardHeader>
                <CardContent>
                    {sanctions.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 text-slate-500 border-b">
                                    <tr>
                                        <th className="px-4 py-3 font-semibold">{t('date')}</th>
                                        <th className="px-4 py-3 font-semibold">{t('type')}</th>
                                        <th className="px-4 py-3 font-semibold">{t('reason')}</th>
                                        <th className="px-4 py-3 font-semibold text-right">{t('deductionAmount')}</th>
                                        <th className="px-4 py-3 font-semibold">{t('status')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {sanctions.map((s: any) => (
                                        <tr key={s.id}>
                                            <td className="px-4 py-3 text-slate-600">{new Date(s.date).toLocaleDateString('fr-FR')}</td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${TYPE_COLOR[s.type] || ''}`}>
                                                    {typeLabel(s.type)}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <p className="text-slate-700 max-w-[200px] truncate">{s.reason}</p>
                                                {s.comment && <p className="text-xs text-slate-400 truncate mt-0.5">{s.comment}</p>}
                                                {s.advantage && <p className="text-xs text-orange-500 mt-0.5">{s.advantage.name}</p>}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                {isFinancial(s.type) && Number(s.deductionAmount) > 0
                                                    ? <span className="font-bold text-red-600">-{Number(s.deductionAmount).toLocaleString()} MRU</span>
                                                    : <span className="text-xs text-slate-400">—</span>
                                                }
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${s.status === 'ACTIVE' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'}`}>
                                                    {t(`statuses.${s.status}`)}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p className="text-sm text-gray-400 italic text-center py-8">{t('noSanctions')}</p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

// =========================================
// PRIMES TAB COMPONENT
// =========================================
function PrimesTab({ employeeId, employee, onRefresh }: { employeeId: string; employee: any; onRefresh: () => void }) {
    const t = useTranslations('employees');
    const tc = useTranslations('common');
    const [allPrimes, setAllPrimes] = useState<any[]>([]);
    const [showAddDialog, setShowAddDialog] = useState(false);
    const [addForm, setAddForm] = useState({ advantageId: '', customAmount: '' });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        api.get('/advantages').then(res => setAllPrimes(res.data?.data || [])).catch(() => {});
    }, []);

    // Primes already assigned to this employee
    const assignedIds = new Set((employee.advantages || []).filter((ea: any) => ea.isActive).map((ea: any) => ea.advantageId));
    const availablePrimes = allPrimes.filter(p => !assignedIds.has(p.id));

    const handleAdd = async () => {
        if (!addForm.advantageId) return;
        setSaving(true);
        try {
            await api.post('/allowances/employee-assign', {
                employeeId,
                advantageId: addForm.advantageId,
                customAmount: addForm.customAmount ? parseFloat(addForm.customAmount) : undefined,
                startDate: new Date().toISOString(),
            });
            toast.success(t('primeAdded'));
            setShowAddDialog(false);
            setAddForm({ advantageId: '', customAmount: '' });
            onRefresh();
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Erreur');
        } finally { setSaving(false); }
    };

    const handleRemove = async (employeeAdvantageId: string) => {
        try {
            await api.delete(`/allowances/employee-assign/${employeeAdvantageId}`);
            toast.success(t('primeRemoved'));
            onRefresh();
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Erreur');
        }
    };

    const activePrimes = (employee.advantages || []).filter((ea: any) => ea.isActive);

    const TYPE_COLOR: Record<string, string> = {
        PRIME: 'bg-blue-50 border-blue-100',
        INDEMNITE: 'bg-violet-50 border-violet-100',
        AVANTAGE_NATURE: 'bg-emerald-50 border-emerald-100',
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2 text-base"><Award className="h-4 w-4" />{t('advantagesTitle')}</CardTitle>
                        <CardDescription>{t('advantagesDesc')}</CardDescription>
                    </div>
                    <Button size="sm" onClick={() => setShowAddDialog(true)} className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5">
                        <Plus className="h-3.5 w-3.5" /> {t('addPrime')}
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                {activePrimes.length > 0 ? (
                    <div className="space-y-2">
                        {activePrimes.map((ea: any) => {
                            const adv = ea.advantage;
                            const amount = ea.customAmount ?? adv?.amount;
                            return (
                                <div key={ea.id} className={`flex items-center justify-between p-3 rounded-lg border ${TYPE_COLOR[adv?.type] || 'bg-slate-50 border-slate-100'}`}>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <p className="text-sm font-semibold text-slate-800">{adv?.name}</p>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase">{adv?.type?.replace('_', ' ')}</span>
                                        </div>
                                        <p className="text-xs text-slate-500 mt-0.5">
                                            {t('since')} {new Date(ea.startDate).toLocaleDateString('fr-FR')}
                                            {adv?.isTaxable ? ` · ${t('taxable')}` : ` · ${t('nonTaxable')}`}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="font-bold text-slate-800 text-sm whitespace-nowrap">
                                            {adv?.isPercentage ? `${Number(amount || 0)}%` : `${Number(amount || 0).toLocaleString('fr-FR')} MRU`}
                                        </span>
                                        <button onClick={() => handleRemove(ea.id)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title={tc('delete')}>
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-8">
                        <Award className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                        <p className="text-sm text-gray-400 italic">{t('noAdvantages')}</p>
                    </div>
                )}
            </CardContent>

            {/* Add Prime Dialog */}
            <Dialog open={showAddDialog} onOpenChange={(open) => { if (!open) { setShowAddDialog(false); setAddForm({ advantageId: '', customAmount: '' }); } }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t('addPrime')}</DialogTitle>
                        <DialogDescription>{t('addPrimeDesc')}</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <Label>{t('selectPrime')}</Label>
                            <select
                                value={addForm.advantageId}
                                onChange={e => setAddForm({ ...addForm, advantageId: e.target.value })}
                                className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none shadow-sm"
                                required
                            >
                                <option value="">{t('choosePrime')}</option>
                                {availablePrimes.map(p => (
                                    <option key={p.id} value={p.id}>
                                        {p.name} — {p.isPercentage ? `${Number(p.amount || 0)}%` : `${Number(p.amount || 0).toLocaleString()} MRU`}
                                    </option>
                                ))}
                            </select>
                            {availablePrimes.length === 0 && (
                                <p className="text-xs text-amber-600">{t('allPrimesAssigned')}</p>
                            )}
                        </div>
                        <div className="space-y-1.5">
                            <Label>{t('customAmount')}</Label>
                            <Input type="number" min="0" step="0.01" value={addForm.customAmount} onChange={e => setAddForm({ ...addForm, customAmount: e.target.value })} placeholder={t('customAmountPlaceholder')} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowAddDialog(false)}>{tc('cancel')}</Button>
                        <Button onClick={handleAdd} disabled={saving || !addForm.advantageId} className="bg-blue-600 hover:bg-blue-700 text-white">
                            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                            {tc('save')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Card>
    );
}
