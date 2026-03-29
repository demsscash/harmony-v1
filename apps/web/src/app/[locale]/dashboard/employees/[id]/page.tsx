'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api, { API_BASE_URL } from '@/lib/api';
import Cookies from 'js-cookie';
import { useAuthStore } from '@/store/authStore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Loader2, ArrowLeft, Mail, Phone, Calendar, Briefcase, History, FileText, Banknote, Plane, UserIcon, CheckCircle2, Key, ListTodo, Edit, Award, Percent, Tag, Clock } from 'lucide-react';
import Link from 'next/link';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useTranslations } from 'next-intl';

const EVENT_ICONS: Record<string, any> = { HIRED: CheckCircle2, PROFILE_UPDATED: UserIcon };
const EVENT_COLORS: Record<string, string> = { HIRED: 'text-green-600', PROFILE_UPDATED: 'text-blue-600' };

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
        { id: 'ATTENDANCE', label: 'Pointage', icon: Clock },
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
                toast.success(`Soldes ${currentYear} initialisés avec succès`);
                const balancesRes = await api.get(`/leaves/balances/${employeeId}?year=${currentYear}`).catch(() => null);
                if (balancesRes?.data?.success) setLeaveBalances(balancesRes.data.data || []);
            }
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Erreur lors de l\'initialisation des soldes');
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
                <Link href={`/dashboard/employees/${employee.id}/edit`}>
                    <Button variant="outline" className="gap-2 border-slate-300 text-slate-700 hover:bg-slate-50">
                        <Edit className="h-4 w-4" />
                        <span>{t('editProfile')}</span>
                    </Button>
                </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Panneau gauche */}
                <Card className="border-t-4 border-t-blue-600 overflow-hidden">
                    <CardContent className="pt-6">
                        <div className="flex flex-col items-center text-center mb-6">
                            <div className="h-24 w-24 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-3xl font-bold uppercase mb-4">
                                {employee.firstName[0]}{employee.lastName[0]}
                            </div>
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
                                        <CardTitle className="flex items-center gap-2 text-base"><Plane className="h-4 w-4" />Soldes de congés {currentYear}</CardTitle>
                                        <CardDescription>Jours restants par type de congé</CardDescription>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleInitializeBalances}
                                        disabled={initializingBalances}
                                        className="text-xs"
                                    >
                                        {initializingBalances ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : null}
                                        Initialiser les soldes {currentYear}
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
                                                        <span>Pris : {taken}j</span>
                                                        <span>Restant : {remaining}j</span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-400 italic text-center py-4">Aucun solde configuré. Cliquez sur &quot;Initialiser les soldes&quot; pour commencer.</p>
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
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base"><Award className="h-4 w-4" />{t('advantagesTitle')}</CardTitle>
                                <CardDescription>{t('advantagesDesc')}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {/* Avantages hérités du grade */}
                                {employee.grade?.advantages?.length > 0 && (
                                    <div className="mb-6">
                                        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                                            <Tag className="h-3.5 w-3.5" /> {t('gradeLabel', { name: employee.grade.name })}
                                        </h4>
                                        <div className="space-y-2">
                                            {employee.grade.advantages.map((ga: any) => {
                                                const adv = ga.advantage;
                                                const amount = ga.customAmount ?? adv?.amount;
                                                return (
                                                    <div key={ga.id} className="flex items-center justify-between p-3 bg-blue-50 border border-blue-100 rounded-lg">
                                                        <div>
                                                            <p className="text-sm font-semibold text-slate-800">{adv?.name}</p>
                                                            <p className="text-xs text-slate-500 mt-0.5">{adv?.type?.replace('_', ' ')} {adv?.isTaxable ? `· ${t('taxable')}` : `· ${t('nonTaxable')}`}</p>
                                                        </div>
                                                        <span className="font-bold text-blue-700 text-sm whitespace-nowrap">
                                                            {adv?.isPercentage ? `${amount}%` : `${Number(amount || 0).toLocaleString('fr-FR')} MRU`}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Avantages individuels */}
                                {employee.advantages?.length > 0 ? (
                                    <div>
                                        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                                            <Percent className="h-3.5 w-3.5" /> {t('individualAdvantages')}
                                        </h4>
                                        <div className="space-y-2">
                                            {employee.advantages.filter((ea: any) => ea.isActive).map((ea: any) => {
                                                const adv = ea.advantage;
                                                const amount = ea.customAmount ?? adv?.amount;
                                                return (
                                                    <div key={ea.id} className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-100 rounded-lg">
                                                        <div>
                                                            <p className="text-sm font-semibold text-slate-800">{adv?.name}</p>
                                                            <p className="text-xs text-slate-500 mt-0.5">
                                                                {adv?.type?.replace('_', ' ')} · {t('since')} {new Date(ea.startDate).toLocaleDateString('fr-FR')}
                                                                {ea.endDate ? ` → ${new Date(ea.endDate).toLocaleDateString('fr-FR')}` : ''}
                                                            </p>
                                                        </div>
                                                        <span className="font-bold text-emerald-700 text-sm whitespace-nowrap">
                                                            {adv?.isPercentage ? `${amount}%` : `${Number(amount || 0).toLocaleString('fr-FR')} MRU`}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ) : (
                                    !employee.grade?.advantages?.length && (
                                        <p className="text-sm text-gray-400 italic text-center py-8">{t('noAdvantages')}</p>
                                    )
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {activeTab === 'ATTENDANCE' && (
                        <AttendanceTab employeeId={employeeId} />
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
                                        <Button onClick={handleCreateAccess} className="mt-2 bg-slate-900 hover:bg-slate-800">
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
        </div>
    );
}

// =========================================
// ATTENDANCE TAB COMPONENT
// =========================================
function AttendanceTab({ employeeId }: { employeeId: string }) {
    const [attendances, setAttendances] = useState<any[]>([]);
    const [schedule, setSchedule] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [scheduleForm, setScheduleForm] = useState({ startTime: '08:00', endTime: '17:00', customGraceMinutes: '' });
    const [savingSchedule, setSavingSchedule] = useState(false);

    const now = new Date();
    const [month, setMonth] = useState(now.getMonth() + 1);
    const [year, setYear] = useState(now.getFullYear());

    useEffect(() => {
        setLoading(true);
        Promise.all([
            api.get('/attendance', { params: { month, year, employeeId } }).catch(() => null),
            api.get(`/attendance/schedule/${employeeId}`).catch(() => null),
        ]).then(([attRes, schRes]) => {
            setAttendances(attRes?.data?.data || []);
            if (schRes?.data?.data) {
                const s = schRes.data.data;
                setSchedule(s);
                setScheduleForm({ startTime: s.startTime || '08:00', endTime: s.endTime || '17:00', customGraceMinutes: s.customGraceMinutes?.toString() || '' });
            }
        }).finally(() => setLoading(false));
    }, [employeeId, month, year]);

    const handleSaveSchedule = async () => {
        setSavingSchedule(true);
        try {
            await api.put(`/attendance/schedule/${employeeId}`, {
                startTime: scheduleForm.startTime,
                endTime: scheduleForm.endTime,
                customGraceMinutes: scheduleForm.customGraceMinutes ? Number(scheduleForm.customGraceMinutes) : undefined,
            });
            toast.success('Horaire mis à jour');
        } catch { toast.error('Erreur'); } finally { setSavingSchedule(false); }
    };

    // Stats
    const stats = attendances.reduce((acc: any, a: any) => {
        if (a.status === 'LATE' || a.status === 'LATE_AND_EARLY') acc.late++;
        if (a.status === 'ABSENT') acc.absent++;
        if (a.status === 'PRESENT' || a.status === 'LATE' || a.status === 'EARLY_DEPARTURE' || a.status === 'LATE_AND_EARLY') acc.present++;
        if (a.status === 'EARLY_DEPARTURE' || a.status === 'LATE_AND_EARLY') acc.early++;
        acc.totalDeductions += Number(a.deductionAmount || 0);
        acc.totalLateMin += a.lateMinutes || 0;
        return acc;
    }, { present: 0, late: 0, absent: 0, early: 0, totalDeductions: 0, totalLateMin: 0 });

    const statusLabel: Record<string, string> = { PRESENT: 'Présent', LATE: 'En retard', ABSENT: 'Absent', EARLY_DEPARTURE: 'Départ anticipé', LATE_AND_EARLY: 'Retard + Départ' };
    const statusColor: Record<string, string> = { PRESENT: 'bg-emerald-100 text-emerald-700', LATE: 'bg-amber-100 text-amber-700', ABSENT: 'bg-red-100 text-red-700', EARLY_DEPARTURE: 'bg-orange-100 text-orange-700', LATE_AND_EARLY: 'bg-rose-100 text-rose-700' };

    if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-blue-600" /></div>;

    const monthLabel = new Date(year, month - 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

    return (
        <div className="space-y-4">
            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                    { label: 'Présences', value: stats.present, color: 'text-emerald-600' },
                    { label: 'Retards', value: stats.late, color: 'text-amber-600' },
                    { label: 'Absences', value: stats.absent, color: 'text-red-600' },
                    { label: 'Déductions', value: `${stats.totalDeductions.toLocaleString('fr-FR')} MRU`, color: 'text-red-600' },
                ].map(s => (
                    <div key={s.label} className="bg-white border rounded-xl p-3 text-center">
                        <p className="text-xs text-slate-500">{s.label}</p>
                        <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
                    </div>
                ))}
            </div>

            {/* Schedule config */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2"><Clock className="h-4 w-4" /> Horaire personnalisé</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap items-end gap-3">
                        <div>
                            <label className="text-xs text-slate-500">Arrivée</label>
                            <input type="time" value={scheduleForm.startTime} onChange={e => setScheduleForm({ ...scheduleForm, startTime: e.target.value })} className="block mt-1 text-sm border rounded-lg px-2 py-1.5" />
                        </div>
                        <div>
                            <label className="text-xs text-slate-500">Départ</label>
                            <input type="time" value={scheduleForm.endTime} onChange={e => setScheduleForm({ ...scheduleForm, endTime: e.target.value })} className="block mt-1 text-sm border rounded-lg px-2 py-1.5" />
                        </div>
                        <div>
                            <label className="text-xs text-slate-500">Tolérance (min)</label>
                            <input type="number" min={0} value={scheduleForm.customGraceMinutes} onChange={e => setScheduleForm({ ...scheduleForm, customGraceMinutes: e.target.value })} placeholder="Défaut" className="block mt-1 text-sm border rounded-lg px-2 py-1.5 w-24" />
                        </div>
                        <Button size="sm" onClick={handleSaveSchedule} disabled={savingSchedule} className="bg-blue-600 hover:bg-blue-700 text-white">
                            {savingSchedule ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
                            Enregistrer
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Attendance records */}
            <Card>
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-sm">Pointages — <span className="capitalize">{monthLabel}</span></CardTitle>
                        <div className="flex items-center gap-1">
                            <button onClick={() => { if (month === 1) { setMonth(12); setYear(y => y - 1); } else setMonth(m => m - 1); }} className="p-1 hover:bg-slate-100 rounded">&larr;</button>
                            <button onClick={() => { if (month === 12) { setMonth(1); setYear(y => y + 1); } else setMonth(m => m + 1); }} className="p-1 hover:bg-slate-100 rounded">&rarr;</button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {attendances.length === 0 ? (
                        <p className="text-sm text-slate-400 italic text-center py-6">Aucun pointage ce mois</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b text-left text-slate-500">
                                        <th className="pb-2 font-medium">Date</th>
                                        <th className="pb-2 font-medium">Arrivée</th>
                                        <th className="pb-2 font-medium">Départ</th>
                                        <th className="pb-2 font-medium">Statut</th>
                                        <th className="pb-2 font-medium text-center">Retard</th>
                                        <th className="pb-2 font-medium text-right">Déduction</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {attendances.map((a: any) => (
                                        <tr key={a.id} className="border-b border-slate-100">
                                            <td className="py-2">{new Date(a.date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}</td>
                                            <td className="py-2">{a.clockIn ? new Date(a.clockIn).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '-'}</td>
                                            <td className="py-2">{a.clockOut ? new Date(a.clockOut).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '-'}</td>
                                            <td className="py-2">
                                                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusColor[a.status] || ''}`}>
                                                    {statusLabel[a.status] || a.status}
                                                </span>
                                            </td>
                                            <td className="py-2 text-center">{a.lateMinutes > 0 ? `${a.lateMinutes} min` : '-'}</td>
                                            <td className="py-2 text-right">{Number(a.deductionAmount) > 0 ? <span className="text-red-600 font-semibold">{Number(a.deductionAmount).toLocaleString('fr-FR')} MRU</span> : '-'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
