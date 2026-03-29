'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
    CheckCircle2, ArrowRight, Download, FileText, BadgeIcon,
    User, Briefcase, Building2, Phone, Mail, Calendar,
    Loader2, ArrowLeft, PartyPopper, ChevronRight, ExternalLink
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';

interface Employee {
    id: string;
    firstName: string;
    lastName: string;
    position: string;
    email?: string;
    phone?: string;
    contractType: string;
    hireDate: string;
    status: string;
    department?: { name: string };
    grade?: { name: string };
}

export default function OnboardingPage() {
    const t = useTranslations('employees');
    const tc = useTranslations('common');
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const [employee, setEmployee] = React.useState<Employee | null>(null);
    const [loading, setLoading] = React.useState(true);
    const [downloadingBadge, setDownloadingBadge] = React.useState(false);
    const [downloadingContract, setDownloadingContract] = React.useState(false);

    React.useEffect(() => {
        api.get(`/employees/${id}`)
            .then(res => {
                if (res.data.success) setEmployee(res.data.data);
            })
            .catch(() => toast.error(t('employeeLoadError')))
            .finally(() => setLoading(false));
    }, [id]);

    const handleDownloadBadge = async () => {
        setDownloadingBadge(true);
        try {
            const res = await api.get(`/employees/${id}/badge`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const a = document.createElement('a');
            a.href = url;
            a.download = `badge_${employee?.firstName}_${employee?.lastName}.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            toast.success(t('badgeDownloaded'));
        } catch {
            toast.error(t('badgeError'));
        } finally {
            setDownloadingBadge(false);
        }
    };

    const handleDownloadContract = async () => {
        setDownloadingContract(true);
        try {
            const res = await api.get(`/employees/${id}/contract`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const a = document.createElement('a');
            a.href = url;
            a.download = `contrat_${employee?.firstName}_${employee?.lastName}.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            toast.success(t('contractDownloaded'));
        } catch {
            toast.error(t('contractError'));
        } finally {
            setDownloadingContract(false);
        }
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };
    const itemVariants = {
        hidden: { opacity: 0, y: 24 },
        show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 280, damping: 22 } }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
        );
    }

    if (!employee) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-slate-500">
                <p>{t('notFound')}</p>
                <Link href="/dashboard/employees"><Button variant="outline">{t('backToList')}</Button></Link>
            </div>
        );
    }

    const fullName = `${employee.firstName} ${employee.lastName}`;
    const initials = `${employee.firstName[0]}${employee.lastName[0]}`.toUpperCase();

    const actions = [
        {
            id: 'badge',
            icon: BadgeIcon,
            label: t('generateBadge'),
            description: t('generateBadgeDesc'),
            color: 'blue',
            cta: t('downloadBadgeCta'),
            onClick: handleDownloadBadge,
            loading: downloadingBadge,
        },
        {
            id: 'contract',
            icon: FileText,
            label: t('generateContract'),
            description: t('generateContractDesc'),
            color: 'violet',
            cta: t('generateContractCta'),
            onClick: handleDownloadContract,
            loading: downloadingContract,
        },
        {
            id: 'profile',
            icon: User,
            label: t('completeProfile'),
            description: t('completeProfileDesc'),
            color: 'emerald',
            cta: t('viewProfileCta'),
            href: `/dashboard/employees/${id}`,
        },
    ];

    const colorMap: Record<string, string> = {
        blue: 'bg-blue-50 text-blue-600 border-blue-100',
        violet: 'bg-violet-50 text-violet-600 border-violet-100',
        emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    };
    const btnMap: Record<string, string> = {
        blue: 'bg-blue-600 hover:bg-blue-500 text-white',
        violet: 'bg-violet-600 hover:bg-violet-500 text-white',
        emerald: 'bg-emerald-600 hover:bg-emerald-500 text-white',
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-20">
            <div className="flex items-center gap-2 text-sm text-slate-500">
                <Link href="/dashboard/employees" className="hover:text-slate-900 transition-colors">{t('title')}</Link>
                <ChevronRight className="h-4 w-4" />
                <span className="text-slate-900 font-medium">{t('onboardingBreadcrumb', { name: fullName })}</span>
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 to-violet-600 p-8 text-white shadow-xl shadow-blue-600/20"
            >
                <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/10" />
                <div className="absolute -right-4 -top-4 h-28 w-28 rounded-full bg-white/10" />
                <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-6">
                    <div className="h-20 w-20 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-3xl font-black shrink-0">
                        {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <PartyPopper className="h-5 w-5 text-yellow-300" />
                            <span className="text-white/80 text-sm font-medium">{t('creationSuccess')}</span>
                        </div>
                        <h1 className="text-3xl font-black tracking-tight">{fullName}</h1>
                        <p className="text-white/80 font-medium mt-1">{employee.position}
                            {employee.department && <span> · {employee.department.name}</span>}
                        </p>
                        <div className="flex flex-wrap gap-3 mt-3">
                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-white/20 px-2.5 py-1 rounded-full">
                                <Briefcase className="h-3 w-3" />{employee.contractType}
                            </span>
                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-white/20 px-2.5 py-1 rounded-full">
                                <Calendar className="h-3 w-3" />{t('hiredOn', { date: new Date(employee.hireDate).toLocaleDateString('fr-FR') })}
                            </span>
                            {employee.department && (
                                <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-white/20 px-2.5 py-1 rounded-full">
                                    <Building2 className="h-3 w-3" />{employee.department.name}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </motion.div>

            <div className="grid sm:grid-cols-3 gap-4">
                {[
                    { icon: Mail, label: tc('email'), value: employee.email || tc('notProvided') },
                    { icon: Phone, label: tc('phone'), value: employee.phone || tc('notProvided') },
                    { icon: BadgeIcon, label: t('grade'), value: employee.grade?.name || tc('notAssigned') },
                ].map(info => (
                    <Card key={info.label} className="border-slate-200/60 bg-white/80">
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-slate-100 text-slate-500 shrink-0">
                                <info.icon className="h-4 w-4" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs text-slate-500 font-medium">{info.label}</p>
                                <p className="text-sm font-bold text-slate-800 truncate">{info.value}</p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div>
                <h2 className="text-lg font-bold text-slate-800 mb-4">{t('integrationSteps')}</h2>
                <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid sm:grid-cols-3 gap-5">
                    {actions.map(action => (
                        <motion.div key={action.id} variants={itemVariants}>
                            <Card className="border-slate-200/60 bg-white h-full flex flex-col hover:shadow-md transition-shadow">
                                <CardHeader className="pb-3">
                                    <div className={`h-11 w-11 rounded-xl border flex items-center justify-center mb-3 ${colorMap[action.color]}`}>
                                        <action.icon className="h-5 w-5" />
                                    </div>
                                    <CardTitle className="text-base">{action.label}</CardTitle>
                                    <CardDescription className="text-xs leading-relaxed">{action.description}</CardDescription>
                                </CardHeader>
                                <CardContent className="mt-auto pt-0">
                                    {action.href ? (
                                        <Link href={action.href}>
                                            <Button className={`w-full gap-2 ${btnMap[action.color]}`}>
                                                {action.cta} <ArrowRight className="h-4 w-4" />
                                            </Button>
                                        </Link>
                                    ) : (
                                        <Button className={`w-full gap-2 ${btnMap[action.color]}`} onClick={action.onClick} disabled={action.loading}>
                                            {action.loading
                                                ? <><Loader2 className="h-4 w-4 animate-spin" /> {t('generating')}</>
                                                : <>{action.id === 'badge' ? <Download className="h-4 w-4" /> : <FileText className="h-4 w-4" />} {action.cta}</>
                                            }
                                        </Button>
                                    )}
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </motion.div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                <Link href="/dashboard/employees">
                    <Button variant="outline" className="gap-2 text-slate-600">
                        <ArrowLeft className="h-4 w-4" /> {t('backToList')}
                    </Button>
                </Link>
                <Link href={`/dashboard/employees/${id}`}>
                    <Button className="gap-2 bg-slate-900 hover:bg-slate-700 text-white">
                        {t('viewFullProfile')} <ExternalLink className="h-4 w-4" />
                    </Button>
                </Link>
            </div>
        </div>
    );
}
