import React, { useState, useMemo, useCallback } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  MarkerType,
  Position,
  Handle,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { 
  Network, 
  Sparkles, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  User, 
  Layers, 
  X, 
  Bot,
  HelpCircle,
  Calendar
} from 'lucide-react';
import { useEvent } from '../context/EventContext.js';
import { Task } from '../types/index.js';

// Custom Node Component for Tasks in Digital Twin
const TaskNode = ({ data }: any) => {
  const isSelected = data.isSelected;
  const isBlocked = data.task.status === 'BLOCKED';
  const isDone = data.task.status === 'DONE';
  const isCritical = data.task.priority === 'CRITICAL';

  let borderColor = 'border-[#EAEFF7]';
  let bgColor = 'bg-white';
  if (isDone) borderColor = 'border-emerald-200 bg-emerald-50/40';
  else if (isBlocked) borderColor = 'border-amber-200 bg-amber-50/40';
  else if (isCritical) borderColor = 'border-rose-200 bg-rose-50/40';
  if (isSelected) borderColor = 'border-[#8B5CF6] ring-2 ring-[#8B5CF6]/30 shadow-card';

  return (
    <div className={`w-56 p-3.5 rounded-2xl border ${borderColor} ${bgColor} text-left shadow-card transition-all`}>
      <Handle type="target" position={Position.Top} className="w-2 h-2 !bg-[#8B5CF6]" />
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 text-[#7A829D]">
          {data.task.team?.name?.split(' ')[0] || 'Task'}
        </span>
        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
          isDone ? 'bg-emerald-50 text-emerald-700' : isBlocked ? 'bg-amber-50 text-amber-700' : 'bg-purple-50 text-[#7C3AED]'
        }`}>
          {data.task.status}
        </span>
      </div>
      <div className="text-xs font-bold text-[#191E35] leading-snug line-clamp-2">
        {data.task.title}
      </div>
      <div className="mt-2.5 pt-2 border-t border-[#EAEFF7] flex items-center justify-between text-[10px] text-[#7A829D]">
        <span>{new Date(data.task.deadline).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
        <span className="font-semibold text-[#191E35] truncate max-w-[80px]">
          {data.task.assignee?.name || 'Unassigned'}
        </span>
      </div>
      <Handle type="source" position={Position.Bottom} className="w-2 h-2 !bg-[#8B5CF6]" />
    </div>
  );
};

export const DigitalTwinPage: React.FC = () => {
  const { currentEvent } = useEvent();
  const tasks = currentEvent?.tasks || [];

  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const [explaining, setExplaining] = useState(false);

  // Generate React Flow Nodes and Edges from tasks and dependencies
  const { initialNodes, initialEdges } = useMemo(() => {
    const nodes: any[] = [];
    const edges: any[] = [];

    // Group tasks into rows/columns
    tasks.slice(0, 15).forEach((task, index) => {
      const col = index % 4;
      const row = Math.floor(index / 4);

      nodes.push({
        id: task.id,
        type: 'taskNode',
        position: { x: col * 260 + 50, y: row * 160 + 50 },
        data: { task, isSelected: selectedTask?.id === task.id },
      });

      // Add edges from dependencies
      if (task.dependencies) {
        task.dependencies.forEach((dep) => {
          edges.push({
            id: `edge-${dep.dependsOnTaskId}-${task.id}`,
            source: dep.dependsOnTaskId,
            target: task.id,
            animated: task.status === 'BLOCKED',
            style: { stroke: task.status === 'BLOCKED' ? '#F59E0B' : '#8B5CF6', strokeWidth: 2 },
            markerEnd: { type: MarkerType.ArrowClosed, color: task.status === 'BLOCKED' ? '#F59E0B' : '#8B5CF6' },
          });
        });
      }
    });

    return { initialNodes: nodes, initialEdges: edges };
  }, [tasks, selectedTask?.id]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const nodeTypes = useMemo(() => ({ taskNode: TaskNode }), []);

  const onNodeClick = useCallback((_: any, node: any) => {
    setSelectedTask(node.data.task);
    setAiExplanation(null);
  }, []);

  const handleExplainNode = () => {
    if (!selectedTask) return;
    setExplaining(true);
    setTimeout(() => {
      setExplaining(false);
      setAiExplanation(
        `**AI Digital Twin Analysis for "${selectedTask.title}":**\n\n` +
        `- **Critical Path Importance**: This task is situated in the **${selectedTask.team?.name || 'Operations'}** workstream. Downstream deliverables depend on its completion by **${new Date(selectedTask.deadline).toLocaleDateString()}**.\n` +
        `- **Risk Evaluation**: Assigned priority is **${selectedTask.priority}**. ${
          selectedTask.status === 'BLOCKED'
            ? 'Currently **BLOCKED** by an upstream prerequisite. Resolving this will free up 2 downstream milestone tasks.'
            : 'Currently proceeding according to the planned sprint schedule.'
        }\n` +
        `- **Recommended Action**: ${
          !selectedTask.assigneeId
            ? 'Assign a volunteer using Smart Volunteer Matching to prevent deadline slips.'
            : 'Maintain current checkpoint tracking.'
        }`
      );
    }, 600);
  };

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#EAEFF7]">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#8B5CF6] animate-pulse" />
            <h1 className="text-xl font-bold text-[#191E35] flex items-center space-x-2">
              <Network className="w-5 h-5 text-[#8B5CF6]" />
              <span>Event Digital Twin</span>
            </h1>
          </div>
          <p className="text-xs text-[#7A829D] mt-0.5 font-medium">
            Real-time topological graph of tasks, teams, dependencies, and critical bottleneck paths.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs text-[#7A829D] font-medium">Click any node to inspect details & AI analysis</span>
        </div>
      </div>

      {/* Main Flow Canvas with Slide-out Inspector Drawer */}
      <div className="flex-1 relative rounded-3xl border border-[#EAEFF7] bg-white overflow-hidden shadow-card">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          onNodeClick={onNodeClick}
          fitView
          className="bg-[#F8FAFC]"
        >
          <Background color="#E2E8F0" gap={20} size={1} />
          <Controls className="!bg-white !border-[#EAEFF7] !text-[#191E35] shadow-card rounded-xl" />
          <MiniMap 
            nodeColor={(n: any) => n.data?.task?.status === 'DONE' ? '#10B981' : '#8B5CF6'}
            className="!bg-white !border-[#EAEFF7] rounded-2xl shadow-card" 
          />
        </ReactFlow>

        {/* Node Inspector Flyout Panel */}
        {selectedTask && (
          <div className="absolute top-4 right-4 w-80 sm:w-96 bg-white/95 backdrop-blur-xl border border-[#EAEFF7] rounded-3xl shadow-card p-5 z-20 animate-scale-in">
            <div className="flex items-start justify-between pb-3 border-b border-[#EAEFF7] mb-4">
              <div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#EDE9FE] text-[#7C3AED] font-bold">
                  NODE INSPECTION
                </span>
                <h3 className="text-sm font-bold text-[#191E35] mt-1.5 leading-snug">{selectedTask.title}</h3>
              </div>
              <button onClick={() => setSelectedTask(null)} className="p-1 text-[#7A829D] hover:text-[#191E35]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-[#EAEFF7]">
                <span className="text-[#7A829D]">Status</span>
                <span className="font-semibold text-[#7C3AED]">{selectedTask.status}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#EAEFF7]">
                <span className="text-[#7A829D]">Priority</span>
                <span className={`font-semibold ${selectedTask.priority === 'CRITICAL' ? 'text-rose-600' : 'text-amber-600'}`}>
                  {selectedTask.priority}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#EAEFF7]">
                <span className="text-[#7A829D]">Workstream Team</span>
                <span className="text-[#191E35] font-medium">{selectedTask.team?.name || 'Core Operations'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#EAEFF7]">
                <span className="text-[#7A829D]">Assignee</span>
                <span className="text-[#191E35] font-medium">{selectedTask.assignee?.name || 'Unassigned'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#EAEFF7]">
                <span className="text-[#7A829D]">Target Deadline</span>
                <span className="text-[#191E35] font-medium">{new Date(selectedTask.deadline).toLocaleDateString()}</span>
              </div>
            </div>

            {/* AI "Explain this" Button */}
            <div className="mt-4 pt-3 border-t border-[#EAEFF7]">
              <button
                onClick={handleExplainNode}
                disabled={explaining}
                className="w-full py-2.5 px-3 rounded-xl bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4 text-white" />
                <span>{explaining ? 'Analyzing Node...' : 'Explain this Node with AI'}</span>
              </button>

              {/* AI Explanation Box */}
              {aiExplanation && (
                <div className="mt-3 p-3.5 rounded-2xl bg-[#F5F3FF] border border-purple-100 text-xs text-[#191E35] leading-relaxed max-h-48 overflow-y-auto animate-fade-in whitespace-pre-wrap font-medium">
                  {aiExplanation}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
