import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
    ResponsiveContainer, RadialBarChart, RadialBar, Cell,
} from 'recharts';
import { Cpu, CheckCircle2, RefreshCw } from 'lucide-react';

const CLASS_COLORS = {
    Low: '#059669',
    Medium: '#d97706',
    High: '#e11d48',
};

const ConfusionCell = ({ value, maxVal, label }) => {
    const intensity = maxVal > 0 ? value / maxVal : 0;
    const bg = `rgba(0,178,178,${0.08 + intensity * 0.7})`;
    return (
        <div style={{
            background: bg,
            borderRadius: 8,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '10px 6px',
            border: '1px solid rgba(0,178,178,0.15)',
            minWidth: 60,
        }}>
            <span style={{ fontSize: 20, fontWeight: 800, color: 'var(--teal-700)', lineHeight: 1 }}>{value}</span>
            {label && <span style={{ fontSize: 9, color: 'var(--gray-500)', marginTop: 3, textAlign: 'center' }}>{label}</span>}
        </div>
    );
};

const CustomBarTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div style={{
            background: '#fff', border: '1px solid var(--gray-200)',
            borderRadius: 10, padding: '10px 14px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.10)', fontSize: 12,
        }}>
            <p style={{ fontWeight: 700, color: 'var(--gray-900)', marginBottom: 6 }}>{label} Risk Class</p>
            {payload.map(p => (
                <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                    <div style={{ width: 8, height: 8, borderRadius: 2, background: p.fill }} />
                    <span style={{ color: 'var(--gray-600, #475569)' }}>{p.name}:</span>
                    <span style={{ fontWeight: 700, color: 'var(--gray-900)' }}>{p.value}%</span>
                </div>
            ))}
        </div>
    );
};

export default function ModelMetrics() {
    const [metrics, setMetrics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchMetrics = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await axios.get('http://localhost:8000/model/metrics');
            setMetrics(res.data);
        } catch (e) {
            setError('Could not load metrics from API.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchMetrics(); }, []);

    if (loading) return (
        <div className="card" style={{ padding: 32, textAlign: 'center', color: 'var(--gray-500)' }}>
            <RefreshCw size={20} className="animate-spin" style={{ margin: '0 auto 10px', color: 'var(--teal-500)' }} />
            Loading model metrics…
        </div>
    );

    if (error) return (
        <div className="card" style={{ padding: 24, textAlign: 'center', color: '#e11d48', fontSize: 13 }}>
            {error}
        </div>
    );

    const { accuracy, per_class, confusion_matrix: cm, class_labels, class_counts, test_samples } = metrics;

    // Find max value in confusion matrix for heat intensity
    const maxCM = Math.max(...cm.flat());

    // Gauge percentage for accuracy ring
    const gaugeData = [
        { name: 'Accuracy', value: accuracy, fill: 'var(--teal-500)' },
        { name: 'Gap', value: 100 - accuracy, fill: '#f1f5f9' },
    ];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

            {/* ── HEADER ────────────────────────────────────── */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{
                        width: 32, height: 32, borderRadius: 8,
                        background: 'var(--teal-50)', border: '1px solid var(--teal-200)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <Cpu size={15} color="var(--teal-700)" />
                    </div>
                    <div>
                        <h2 style={{ fontSize: 15, fontWeight: 800, color: 'var(--gray-900)' }}>Model Performance</h2>
                        <p style={{ fontSize: 11, color: 'var(--gray-500)' }}>
                            Evaluated on {test_samples} held-out test samples
                        </p>
                    </div>
                </div>
                <button onClick={fetchMetrics} className="btn-outline" style={{ padding: '5px 12px', fontSize: 11 }}>
                    <RefreshCw size={12} /> Refresh
                </button>
            </div>

            {/* ── TOP ROW: Accuracy Ring + Class Counts ──── */}
            <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: 14 }}>

                {/* Accuracy donut */}
                <div className="card" style={{ padding: '16px 12px', textAlign: 'center' }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
                        Overall Accuracy
                    </p>
                    <div style={{ position: 'relative', height: 120 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <RadialBarChart
                                innerRadius="65%" outerRadius="95%"
                                data={gaugeData} startAngle={90} endAngle={-270}
                                barSize={14}
                            >
                                <RadialBar dataKey="value" cornerRadius={8} background={{ fill: '#f1f5f9' }}>
                                    <Cell key="acc" fill="var(--teal-500)" />
                                    <Cell key="gap" fill="transparent" />
                                </RadialBar>
                            </RadialBarChart>
                        </ResponsiveContainer>
                        {/* Center label */}
                        <div style={{
                            position: 'absolute', top: '50%', left: '50%',
                            transform: 'translate(-50%, -50%)',
                            textAlign: 'center',
                        }}>
                            <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--teal-700)', lineHeight: 1 }}>
                                {accuracy}%
                            </div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 4, marginTop: 4 }}>
                        <CheckCircle2 size={13} color="var(--teal-500)" />
                        <span style={{ fontSize: 11, color: 'var(--gray-500)' }}>Hybrid Ensemble</span>
                    </div>
                </div>

                {/* Class sample breakdown */}
                <div className="card" style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 10 }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>
                        Test Set Distribution
                    </p>
                    {class_labels.map((cls, i) => {
                        const pct = ((class_counts[i] / test_samples) * 100).toFixed(0);
                        return (
                            <div key={cls}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 12 }}>
                                    <span style={{ fontWeight: 600, color: CLASS_COLORS[cls] }}>{cls}</span>
                                    <span style={{ color: 'var(--gray-500)' }}>{class_counts[i]} samples ({pct}%)</span>
                                </div>
                                <div style={{ height: 6, borderRadius: 3, background: 'var(--gray-200)', overflow: 'hidden' }}>
                                    <div style={{ width: `${pct}%`, height: '100%', background: CLASS_COLORS[cls], borderRadius: 3, transition: 'width 1s' }} />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* ── BAR CHART: Precision / Recall / F1 ──────── */}
            <div className="card" style={{ padding: '18px 20px' }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--gray-700)', marginBottom: 16 }}>
                    Precision · Recall · F1 Score  <span style={{ fontWeight: 400, color: 'var(--gray-400)', fontSize: 11 }}>(per class, %)</span>
                </p>
                <div style={{ height: 200 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={per_class} barCategoryGap="30%" barGap={4} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                            <XAxis
                                dataKey="class" tick={{ fontSize: 12, fontWeight: 600 }}
                                tickLine={false} axisLine={false}
                                tickFormatter={v => v}
                            />
                            <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                            <Tooltip content={<CustomBarTooltip />} />
                            <Legend
                                iconType="square" iconSize={8}
                                wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                            />
                            <Bar dataKey="precision" name="Precision" radius={[4, 4, 0, 0]}>
                                {per_class.map(d => <Cell key={d.class} fill={CLASS_COLORS[d.class]} />)}
                            </Bar>
                            <Bar dataKey="recall" name="Recall" fill="#00c8c8" radius={[4, 4, 0, 0]} fillOpacity={0.7} />
                            <Bar dataKey="f1" name="F1 Score" fill="#1c7b8c" radius={[4, 4, 0, 0]} fillOpacity={0.85} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* ── CONFUSION MATRIX ────────────────────────── */}
            <div className="card" style={{ padding: '18px 20px' }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--gray-700)', marginBottom: 4 }}>
                    Confusion Matrix
                </p>
                <p style={{ fontSize: 11, color: 'var(--gray-400)', marginBottom: 14 }}>
                    Rows = Actual · Columns = Predicted
                </p>

                {/* Column headers */}
                <div style={{ display: 'grid', gridTemplateColumns: '72px repeat(3, 1fr)', gap: 6, marginBottom: 6 }}>
                    <div />
                    {class_labels.map(l => (
                        <div key={l} style={{ textAlign: 'center', fontSize: 11, fontWeight: 700, color: CLASS_COLORS[l], textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            {l}
                        </div>
                    ))}
                </div>

                {/* Matrix rows */}
                {cm.map((row, i) => (
                    <div key={i} style={{ display: 'grid', gridTemplateColumns: '72px repeat(3, 1fr)', gap: 6, marginBottom: 6, alignItems: 'center' }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: CLASS_COLORS[class_labels[i]], textAlign: 'right', paddingRight: 10 }}>
                            {class_labels[i]}
                        </div>
                        {row.map((val, j) => (
                            <ConfusionCell
                                key={j}
                                value={val}
                                maxVal={maxCM}
                                label={i === j ? '✓ Correct' : null}
                            />
                        ))}
                    </div>
                ))}

                <p style={{ fontSize: 10, color: 'var(--gray-400)', marginTop: 8, textAlign: 'center' }}>
                    Darker = more predictions. Diagonal cells = correct predictions.
                </p>
            </div>
        </div>
    );
}
