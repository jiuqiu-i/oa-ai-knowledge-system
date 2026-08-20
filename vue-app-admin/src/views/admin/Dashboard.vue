<script setup lang="ts">
import { ref, computed, h, onMounted, watch } from "vue";
import type { Component } from "vue";
import { useRouter } from "vue-router";
import type { DataTableColumns, SelectOption } from "naive-ui";
import {
    NGrid,
    NGridItem,
    NCard,
    NStatistic,
    NSpace,
    NButton,
    NSelect,
    NTag,
    NDataTable,
    NAvatar,
    NThing,
    NText,
    NEllipsis,
    NEmpty,
    useMessage,
} from "naive-ui";
import {
    Users,
    Activity,
    ClipboardList,
    BookOpen,
    TrendingUp,
    AlertCircle,
    Info,
    CheckCircle,
    Bell,
    ChevronRight,
    BarChart3,
    PieChart,
    Megaphone,
    LogIn,
    Check,
    X,
} from "lucide-vue-next";
import type { EChartsOption } from "echarts";
import EChart from "@/components/EChart.vue";
import type {
    Announcement,
    RecentLogin,
    Approval,
    ApprovalStatus,
} from "@/types";
import { useDashboardStore, useApprovalStore } from "@/stores";

const router = useRouter();
const message = useMessage();
const dashboardStore = useDashboardStore();
const approvalStore = useApprovalStore();

// 进入页面拉取真实仪表盘数据（后端不可达时保留演示兜底）
onMounted(() => {
    dashboardStore.fetchAll();
    // 仪表盘待处理审批：仅加载前 5 条 pending/processing 数据
    approvalStore.fetchApprovals({ status: "pending", page: 1, pageSize: 5 });
});

const period = ref<string>("7");
const periodOptions: SelectOption[] = [
    { label: "近 7 天", value: "7" },
    { label: "近 30 天", value: "30" },
];

// 切换周期 -> 重新拉取趋势
watch(period, () => {
    dashboardStore.fetchTrends();
});

const avatarColorFor = (name: string) => {
    const palette = [
        "#E58A2E",
        "#2E90FA",
        "#34A853",
        "#F5B800",
        "#9F968A",
        "#2A261F",
        "#8B5CF6",
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++)
        hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
    return palette[hash % palette.length];
};

const activityOption = computed<EChartsOption>(() => ({
    tooltip: {
        trigger: "axis",
        backgroundColor: "#fff",
        borderColor: "#E8E2D9",
        borderWidth: 1,
        textStyle: { color: "#2A261F" },
        padding: [12, 16],
        formatter: (params: unknown) => {
            const p = (
                params as {
                    name: string;
                    seriesName: string;
                    value: number;
                    color: string;
                }[]
            )[0];
            return `<div style="font-weight:600;margin-bottom:4px">${p.name}</div>
              <div style="display:flex;align-items:center;gap:8px">
                <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${p.color}"></span>
                <span>${p.seriesName}：</span>
                <strong>${p.value}</strong>
              </div>`;
        },
    },
    grid: {
        left: 0,
        right: 16,
        top: 24,
        bottom: 8,
        containLabel: true,
    },
    xAxis: {
        type: "category",
        data: dashboardStore.trends.map((t) => t.date),
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: "#6E665B", fontSize: 12 },
    },
    yAxis: {
        type: "value",
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { lineStyle: { color: "#E8E2D9", type: "dashed" } },
        axisLabel: { color: "#6E665B", fontSize: 12 },
    },
    series: [
        {
            name: "活跃用户数",
            type: "line",
            data: dashboardStore.trends.map((t) => t.newUsers),
            smooth: true,
            symbolSize: 8,
            lineStyle: { color: "#E58A2E", width: 3 },
            itemStyle: {
                color: "#E58A2E",
                borderColor: "#fff",
                borderWidth: 2,
            },
            areaStyle: {
                color: {
                    type: "linear",
                    x: 0,
                    y: 0,
                    x2: 0,
                    y2: 1,
                    colorStops: [
                        { offset: 0, color: "rgba(229, 138, 46, 0.28)" },
                        { offset: 1, color: "rgba(229, 138, 46, 0.02)" },
                    ],
                },
            },
        },
    ],
}));

const deptOption = computed<EChartsOption>(() => ({
    tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        backgroundColor: "#fff",
        borderColor: "#E8E2D9",
        borderWidth: 1,
        textStyle: { color: "#2A261F" },
        padding: [12, 16],
        formatter: (params: unknown) => {
            const p = (
                params as {
                    name: string;
                    seriesName: string;
                    value: number;
                    color: string;
                }[]
            )[0];
            return `<div style="font-weight:600;margin-bottom:4px">${p.name}</div>
              <div style="display:flex;align-items:center;gap:8px">
                <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${p.color}"></span>
                <span>${p.seriesName}：</span>
                <strong>${p.value}</strong>
              </div>`;
        },
    },
    grid: {
        left: 0,
        right: 16,
        top: 16,
        bottom: 8,
        containLabel: true,
    },
    xAxis: {
        type: "category",
        data: dashboardStore.deptContributions.map((d) => d.dept),
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: "#6E665B", fontSize: 12 },
    },
    yAxis: {
        type: "value",
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { lineStyle: { color: "#E8E2D9", type: "dashed" } },
        axisLabel: { color: "#6E665B", fontSize: 12 },
    },
    series: [
        {
            name: "文档贡献数",
            type: "bar",
            data: dashboardStore.deptContributions.map((d) => d.count),
            barWidth: 22,
            itemStyle: {
                borderRadius: [5, 5, 0, 0],
                color: (params: unknown) => {
                    const colors = [
                        "#E58A2E",
                        "#2E90FA",
                        "#34A853",
                        "#F5B800",
                        "#9F968A",
                        "#2A261F",
                    ];
                    return colors[
                        (params as { dataIndex: number }).dataIndex %
                            colors.length
                    ];
                },
            },
        },
    ],
}));

interface MetricCard {
    label: string;
    value: number;
    trend: string;
    trendText: string;
    icon: Component;
    type: string;
    trendType: string;
}

const metricCards = computed<MetricCard[]>(() => [
    {
        label: "总员工数",
        value: dashboardStore.stats.totalUsers,
        trend: "总数",
        trendText: "员工总数",
        icon: Users,
        type: "primary",
        trendType: "success",
    },
    {
        label: "今日活跃",
        value: dashboardStore.stats.activeUsers,
        trend: "活跃",
        trendText: "活跃用户",
        icon: Activity,
        type: "info",
        trendType: "success",
    },
    {
        label: "待处理审批",
        value: dashboardStore.stats.pendingApprovals,
        trend: "待审批",
        trendText: "需关注",
        icon: ClipboardList,
        type: "warning",
        trendType: "error",
    },
    {
        label: "知识库文档数",
        value: dashboardStore.stats.totalDocs,
        trend: "文档",
        trendText: "文档总数",
        icon: BookOpen,
        type: "success",
        trendType: "success",
    },
]);

const typeIconMap: Record<string, Component> = {
    info: Info,
    success: CheckCircle,
    warning: Bell,
};

const typeColorMap: Record<string, { bg: string; color: string }> = {
    info: { bg: "rgba(46, 144, 250, 0.1)", color: "#2E90FA" },
    success: { bg: "rgba(52, 168, 83, 0.1)", color: "#34A853" },
    warning: { bg: "rgba(245, 184, 0, 0.1)", color: "#F5B800" },
};

// 公告：后端无公告接口，暂时显示静态占位提示
const announcements: Announcement[] = [
    {
        type: "info",
        date: "系统公告",
        title: "如需发布企业公告，请在系统设置中维护公告内容",
    },
    {
        type: "success",
        date: "新功能",
        title: "知识库支持全文检索 + AI 摘要，点击文档卡片查看详情",
    },
    {
        type: "warning",
        date: "提示",
        title: "所有审批/成员/知识库操作已对接后端接口",
    },
];

// 最近登录：后端暂无最近登录接口，显示友好占位，而非假数据
const recentLogins: RecentLogin[] = [
    {
        name: "登录轨迹",
        dept: "功能提示：登录记录功能待接入",
        time: "—",
        color: "#9F968A",
    },
];

// ------------------ 待处理审批表格：使用真实 approvalStore 数据 ------------------

const statusMetaForRow = (s: ApprovalStatus) => {
    const map: Record<
        ApprovalStatus,
        {
            label: string;
            type: "warning" | "info" | "success" | "error" | "default";
        }
    > = {
        pending: { label: "待审批", type: "warning" },
        processing: { label: "审批中", type: "info" },
        approved: { label: "已通过", type: "success" },
        rejected: { label: "已驳回", type: "error" },
    };
    return map[s] || { label: s, type: "default" as const };
};

const approvalTypeLabelForRow: Record<Approval["type"], string> = {
    leave: "请假申请",
    reimburse: "报销申请",
    purchase: "采购申请",
    seal: "用印申请",
};

const approvalColumns: DataTableColumns<Approval> = [
    {
        title: "申请人",
        key: "applicant",
        width: 140,
        render(row) {
            const name = row.applicant || "未知";
            const color = avatarColorFor(name);
            return h(
                NSpace,
                { align: "center", size: 10 },
                {
                    default: () => [
                        h(
                            NAvatar,
                            {
                                round: true,
                                size: 32,
                                style: {
                                    background: color,
                                    color: "#fff",
                                    fontSize: "12px",
                                    fontWeight: 600,
                                },
                            },
                            { default: () => name.charAt(0) }
                        ),
                        h(
                            "span",
                            { style: { fontWeight: 500, color: "#2A261F" } },
                            name
                        ),
                    ],
                }
            );
        },
    },
    {
        title: "类型",
        key: "type",
        width: 120,
        render(row) {
            return approvalTypeLabelForRow[row.type] || row.type;
        },
    },
    { title: "时间", key: "submitTime", width: 160 },
    {
        title: "状态",
        key: "status",
        width: 120,
        render(row) {
            const meta = statusMetaForRow(row.status);
            return h(
                NTag,
                {
                    type: meta.type as never,
                    size: "small",
                    round: true,
                    bordered: false,
                },
                {
                    default: () => meta.label,
                    icon: () => h(AlertCircle, { size: 12 }),
                }
            );
        },
    },
    {
        title: "操作",
        key: "actions",
        align: "right",
        width: 180,
        render(row) {
            const actionable =
                row.status === "pending" || row.status === "processing";
            return h(
                NSpace,
                { size: 8, justify: "end" },
                {
                    default: () => [
                        h(
                            NButton,
                            {
                                quaternary: true,
                                type: "success",
                                size: "small",
                                disabled: !actionable,
                                onClick: async () => {
                                    await approvalStore.approveItem(row.id);
                                    message.success(`「${row.title}」已通过`);
                                },
                            },
                            {
                                default: () => "通过",
                                icon: () => h(Check, { size: 14 }),
                            }
                        ),
                        h(
                            NButton,
                            {
                                quaternary: true,
                                type: "error",
                                size: "small",
                                disabled: !actionable,
                                onClick: async () => {
                                    await approvalStore.rejectItem(row.id);
                                    message.error(`「${row.title}」已驳回`);
                                },
                            },
                            {
                                default: () => "驳回",
                                icon: () => h(X, { size: 14 }),
                            }
                        ),
                    ],
                }
            );
        },
    },
];

const approvalData = computed<Approval[]>(() => approvalStore.approvals);
const approvalLoading = computed<boolean>(() => approvalStore.loading);

function viewAllApprovals() {
    router.push("/admin/approvals");
}
</script>

<template>
    <div class="dashboard-page">
        <!-- Metric cards -->
        <n-grid :cols="4" :x-gap="16" :y-gap="16" responsive="screen" class="metric-grid">
            <n-grid-item v-for="(card, index) in metricCards" :key="index" span="1">
                <n-card class="metric-card" :bordered="false">
                    <n-space vertical :size="12">
                        <n-space align="start" justify="space-between">
                            <n-space vertical :size="4">
                                <n-text class="metric-label">{{ card.label }}</n-text>
                                <n-statistic :value="card.value" class="metric-value" />
                            </n-space>
                            <div class="metric-icon" :class="card.type">
                                <component :is="card.icon" :size="22" />
                            </div>
                        </n-space>
                        <n-space align="center" :size="8" class="metric-trend">
                            <n-tag
                                :type="card.trendType as never"
                                size="small"
                                round
                                :bordered="false"
                            >
                                <template #icon>
                                    <TrendingUp :size="12" />
                                </template>
                                {{ card.trend }}
                            </n-tag>
                            <n-text class="trend-text">{{ card.trendText }}</n-text>
                        </n-space>
                    </n-space>
                </n-card>
            </n-grid-item>
        </n-grid>

        <!-- Charts + sidebar -->
        <n-grid :cols="3" :x-gap="16" :y-gap="16" class="main-grid">
            <n-grid-item span="2">
                <n-card class="chart-card" :bordered="false" segmented>
                    <template #header>
                        <n-space align="center" :size="8">
                            <div class="section-icon primary">
                                <BarChart3 :size="16" />
                            </div>
                            <span class="section-title">系统活跃度趋势</span>
                        </n-space>
                    </template>
                    <template #header-extra>
                        <n-select
                            v-model:value="period"
                            :options="periodOptions"
                            size="small"
                            style="width: 120px"
                        />
                    </template>
                    <EChart :option="activityOption" height="280px" />
                </n-card>

                <n-card class="chart-card" :bordered="false" segmented>
                    <template #header>
                        <n-space align="center" :size="8">
                            <div class="section-icon info">
                                <PieChart :size="16" />
                            </div>
                            <span class="section-title">各部门知识贡献</span>
                        </n-space>
                    </template>
                    <EChart :option="deptOption" height="248px" />
                </n-card>
            </n-grid-item>

            <n-grid-item span="1">
                <n-card class="side-card" :bordered="false" segmented>
                    <template #header>
                        <n-space align="center" :size="8">
                            <div class="section-icon warning">
                                <Megaphone :size="16" />
                            </div>
                            <span class="section-title">系统公告</span>
                        </n-space>
                    </template>
                    <div class="announcement-list">
                        <n-thing
                            v-for="(item, index) in announcements"
                            :key="index"
                            class="announcement-item"
                        >
                            <template #avatar>
                                <div
                                    class="announcement-icon"
                                    :style="{ background: typeColorMap[item.type].bg, color: typeColorMap[item.type].color }"
                                >
                                    <component :is="typeIconMap[item.type]" :size="12" />
                                </div>
                            </template>
                            <template #header>
                                <n-ellipsis
                                    :line-clamp="2"
                                    class="announcement-title"
                                >{{ item.title }}</n-ellipsis>
                            </template>
                            <template #description>
                                <n-text class="announcement-date">{{ item.date }}</n-text>
                            </template>
                        </n-thing>
                    </div>
                </n-card>

                <n-card class="side-card" :bordered="false" segmented>
                    <template #header>
                        <n-space align="center" :size="8">
                            <div class="section-icon success">
                                <LogIn :size="16" />
                            </div>
                            <span class="section-title">最近登录</span>
                        </n-space>
                    </template>
                    <div class="login-list">
                        <n-thing
                            v-for="(item, index) in recentLogins"
                            :key="index"
                            class="login-item"
                        >
                            <template #avatar>
                                <n-avatar
                                    round
                                    :size="38"
                                    :style="{ background: item.color, color: '#fff', fontSize: '13px', fontWeight: 600 }"
                                >{{ item.name.charAt(0) }}</n-avatar>
                            </template>
                            <template #header>
                                <span class="login-name">{{ item.name }}</span>
                            </template>
                            <template #description>
                                <n-text class="login-dept">{{ item.dept }}</n-text>
                            </template>
                            <template #action>
                                <n-text class="login-time">{{ item.time }}</n-text>
                            </template>
                        </n-thing>
                    </div>
                </n-card>
            </n-grid-item>
        </n-grid>

        <!-- Pending approvals table -->
        <n-card class="approval-card" :bordered="false" segmented>
            <template #header>
                <n-space align="center" :size="8">
                    <div class="section-icon warning">
                        <ClipboardList :size="16" />
                    </div>
                    <span class="section-title">待处理审批</span>
                </n-space>
            </template>
            <template #header-extra>
                <n-button text type="primary" size="small" @click="viewAllApprovals">
                    查看全部
                    <template #icon>
                        <ChevronRight :size="16" />
                    </template>
                </n-button>
            </template>
            <n-empty
                v-if="!approvalLoading && approvalData.length === 0"
                description="暂无待处理审批"
                size="small"
            />
            <n-data-table
                v-else
                :columns="approvalColumns"
                :data="approvalData"
                :bordered="false"
                :single-line="true"
                size="small"
                striped
                :loading="approvalLoading"
                class="approval-table"
            />
        </n-card>
    </div>
</template>

<style scoped>
.dashboard-page {
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.metric-card {
    border-radius: 12px;
    transition: box-shadow 0.25s ease, transform 0.2s ease;
    box-shadow: 0 1px 3px rgba(42, 38, 31, 0.04),
        0 4px 12px rgba(42, 38, 31, 0.04);
}

.metric-card:hover {
    box-shadow: 0 4px 12px rgba(42, 38, 31, 0.08),
        0 8px 24px rgba(42, 38, 31, 0.06);
    transform: translateY(-2px);
}

.metric-label {
    font-size: 13px;
    color: #6e665b;
    font-weight: 500;
}

.metric-value :deep(.n-statistic__value) {
    font-size: 30px;
    font-weight: 700;
    color: #2a261f;
    line-height: 1.2;
}

.metric-icon {
    width: 44px;
    height: 44px;
    border-radius: 10px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
}

.metric-icon.primary {
    background: rgba(229, 138, 46, 0.12);
    color: #e58a2e;
}

.metric-icon.info {
    background: rgba(46, 144, 250, 0.12);
    color: #2e90fa;
}

.metric-icon.warning {
    background: rgba(245, 184, 0, 0.12);
    color: #f5b800;
}

.metric-icon.success {
    background: rgba(52, 168, 83, 0.12);
    color: #34a853;
}

.metric-trend {
    padding-top: 4px;
    border-top: 1px solid #f0ebe3;
}

.trend-text {
    font-size: 12px;
    color: #9f968a;
}

.section-title {
    font-size: 15px;
    font-weight: 600;
    color: #2a261f;
}

.section-icon {
    width: 28px;
    height: 28px;
    border-radius: 7px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
}

.section-icon.primary {
    background: rgba(229, 138, 46, 0.12);
    color: #e58a2e;
}

.section-icon.info {
    background: rgba(46, 144, 250, 0.12);
    color: #2e90fa;
}

.section-icon.warning {
    background: rgba(245, 184, 0, 0.12);
    color: #f5b800;
}

.section-icon.success {
    background: rgba(52, 168, 83, 0.12);
    color: #34a853;
}

.chart-card {
    border-radius: 12px;
    margin-bottom: 16px;
    box-shadow: 0 1px 3px rgba(42, 38, 31, 0.04),
        0 4px 12px rgba(42, 38, 31, 0.04);
}

.chart-card:last-child {
    margin-bottom: 0;
}

.side-card {
    border-radius: 12px;
    margin-bottom: 16px;
    box-shadow: 0 1px 3px rgba(42, 38, 31, 0.04),
        0 4px 12px rgba(42, 38, 31, 0.04);
}

.side-card:last-child {
    margin-bottom: 0;
}

.announcement-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.announcement-item {
    padding: 12px;
    background: #f9f7f2;
    border-radius: 8px;
    border: 1px solid #ede8df;
    transition: background 0.2s ease;
}

.announcement-item:hover {
    background: #f5f1eb;
}

.announcement-icon {
    width: 22px;
    height: 22px;
    border-radius: 50%;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}

.announcement-title {
    font-size: 13px;
    font-weight: 500;
    color: #2a261f;
    line-height: 1.5;
}

.announcement-date {
    font-size: 12px;
    color: #9f968a;
}

.login-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.login-item {
    padding: 8px 10px;
    border-radius: 8px;
    transition: background 0.2s ease;
}

.login-item:hover {
    background: #f9f7f2;
}

.login-name {
    font-size: 14px;
    font-weight: 600;
    color: #2a261f;
}

.login-dept {
    font-size: 12px;
    color: #9f968a;
}

.login-time {
    font-size: 12px;
    color: #9f968a;
}

.approval-card {
    border-radius: 12px;
    box-shadow: 0 1px 3px rgba(42, 38, 31, 0.04),
        0 4px 12px rgba(42, 38, 31, 0.04);
}

.approval-table :deep(.n-data-table-td) {
    padding: 12px 16px;
}

.approval-table :deep(.n-data-table-th) {
    font-weight: 600;
    color: #6e665b;
    background: #faf8f4;
}
</style>
