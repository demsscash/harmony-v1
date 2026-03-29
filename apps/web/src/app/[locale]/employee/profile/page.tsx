'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Phone, Calendar, Briefcase, UserIcon, CheckCircle2, Award, Banknote } from 'lucide-react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';

export default function MyProfilePage() {
    const { user } = useAuthStore();
    const t = useTranslations('employeePortal');
    const tc = useTranslations('common');
    const [employee, setEmployee] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!user?.employeeId) return;

        // This leverages the existing employee fetch but scoped to their ID
        const tenantSubdomain = user.tenantSubdomain || window.location.hostname.split('.')[0];
        api.get(`/employees/${user.employeeId}`, { headers: { 'X-Tenant-Subdomain': tenantSubdomain } })
            .then(res => {
                if (res.data.success) {
                    setEmployee(res.data.data);
                }
            })
            .catch(() => toast.error(t('errorLoadingProfile')))
            .finally(() => setIsLoading(false));
    }, [user]);

    if (isLoading) {
        return <div className="flex h-96 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-emerald-600" /></div>;
    }

    if (!employee) {
        return <p className="text-center p-8 text-slate-500">{t('dataNotFound')}</p>;
    }

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">{t('myProfile')}</h1>
                <p className="text-slate-500 mt-1">{t('myProfileSubtitle')}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="md:col-span-1 border-t-4 border-t-emerald-500 shadow-sm">
                    <CardContent className="pt-6">
                        <div className="flex flex-col items-center text-center">
                            <div className="h-24 w-24 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white text-3xl font-bold uppercase mb-4 shadow-lg shadow-emerald-500/20">
                                {employee.firstName?.[0]}{employee.lastName?.[0]}
                            </div>
                            <h2 className="text-xl font-bold text-slate-900">{employee.firstName} {employee.lastName}</h2>
                            <p className="text-emerald-600 font-medium text-sm mb-2">{employee.position}</p>
                            <span className="px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-700 flex items-center gap-1">
                                <CheckCircle2 className="h-3 w-3" />{` `}{tc('active')}
                            </span>
                        </div>

                        <div className="border-t mt-6 pt-6 space-y-4">
                            <div className="flex items-start gap-3 text-sm">
                                <UserIcon className="h-4 w-4 text-slate-400 mt-0.5" />
                                <div><p className="font-semibold text-slate-700">{t('matricule')}</p><p className="text-slate-500 font-mono text-xs">{employee.matricule}</p></div>
                            </div>
                            <div className="flex items-start gap-3 text-sm">
                                <Mail className="h-4 w-4 text-slate-400 mt-0.5" />
                                <div><p className="font-semibold text-slate-700">{t('email')}</p><p className="text-slate-500 text-xs">{employee.email || 'N/A'}</p></div>
                            </div>
                            <div className="flex items-start gap-3 text-sm">
                                <Phone className="h-4 w-4 text-slate-400 mt-0.5" />
                                <div><p className="font-semibold text-slate-700">{t('phoneLabel')}</p><p className="text-slate-500 text-xs">{employee.phone || 'N/A'}</p></div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="md:col-span-2 space-y-6">
                    <Card className="shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2"><Briefcase className="h-5 w-5 text-emerald-500" />{` `}{t('professionalInfo')}</CardTitle>
                        </CardHeader>
                        <CardContent className="grid sm:grid-cols-2 gap-y-6 gap-x-8">
                            <div>
                                <p className="text-sm font-semibold text-slate-700">{t('department')}</p>
                                <p className="text-sm text-slate-500 mt-1 flex items-center gap-2">
                                    {employee.department?.name || t('notAssigned')}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-slate-700">{t('manager')}</p>
                                <p className="text-sm text-slate-500 mt-1">
                                    {employee.manager ? `${employee.manager.firstName} ${employee.manager.lastName}` : t('noManager')}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-slate-700">{t('contractType')}</p>
                                <p className="text-sm text-slate-500 mt-1"><span className="px-2 py-1 bg-slate-100 rounded text-xs font-semibold">{employee.contractType}</span></p>
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-slate-700">{t('hireDate')}</p>
                                <p className="text-sm text-slate-500 mt-1 flex items-center gap-1.5"><Calendar className="h-3 w-3" /> {new Date(employee.hireDate).toLocaleDateString('fr-FR')}</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2"><Award className="h-5 w-5 text-blue-500" />{` `}{t('gradeAndPay')}</CardTitle>
                        </CardHeader>
                        <CardContent className="grid sm:grid-cols-2 gap-y-6 gap-x-8">
                            <div>
                                <p className="text-sm font-semibold text-slate-700">{t('currentGrade')}</p>
                                <p className="text-sm text-slate-500 mt-1">{employee.grade?.name || t('noGrade')}</p>
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-slate-700">{t('baseSalary')}</p>
                                <p className="text-sm font-mono text-emerald-600 font-bold mt-1 flex items-center gap-1"><Banknote className="h-3.5 w-3.5" /> {Number(employee.baseSalary).toLocaleString('fr-FR')} {employee.currency}</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
