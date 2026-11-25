import React, { useMemo, useState } from 'react';
import { Sparkles, Users, Heart, ShieldCheck, RefreshCw, AlertCircle, Upload, ChevronDown } from 'lucide-react';
import { analyze } from './engine/analyze';
import { parseChat } from './engine/parser';

const DEMO_TEXT = `2023-10-15 14:20:10 张三: 哈哈哈哈你看这个视频笑死我了 [动画表情]
2023-10-15 14:22:15 李四: 刚才在开会，什么视频？
2023-10-15 14:22:40 张三: 就是那只猫摔倒的，你每次都不立刻看 [表情]
2023-10-15 14:23:00 李四: 可是我真的在忙啊……晚上吃啥？
2023-10-15 14:23:25 张三: 随便吧，你定呗，反正是你挑食
2023-10-15 14:25:00 李四: 那吃火锅？
2023-10-15 14:25:10 张三: 行吧，听你的！
2023-10-15 21:10:02 李四: 今天那个会开得我脑壳疼
2023-10-15 21:10:40 张三: 那你早点睡，别刷手机了
2023-10-15 21:11:05 李四: 你也是 [动画表情]
2023-10-16 09:02:11 张三: 早，起了没
2023-10-16 09:20:33 李四: 起了起了，又要迟到了`;

const MODES = [
  { id: 'general', label: '通用', hint: '平常心', icon: Users },
  { id: 'friends', label: '死党', hint: '可以损', icon: Sparkles },
  { id: 'lovers', label: '情侣', hint: '嘴下留情', icon: Heart },
];

const PRINCIPLES = [
  ['数字是数出来的', '多少条、多少字、几个问号几个表情，都是代码一条条数出来的。同一份记录，每次结果都一样。'],
  ['模型只负责说人话', '哪一型、哪条刻度高，是查表算出来的。模型不参与打分，只把结果讲成正常人能听懂的话。'],
  ['只对这段聊天负责', '这些结论说的是你们这几千条消息，不是你们这个人。换个时间段再跑，可能就换了。'],
  ['样本越多越准', '十几条只能看个大概，两百条以上才有点底气。最多读 6000 条，超了只算最近的部分。'],
];

export default function App() {
  const [rawText, setRawText] = useState('');
  const [mode, setMode] = useState('general');
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const roughCount = useMemo(() => (rawText.trim() ? parseChat(rawText).length : 0), [rawText]);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    let text = await file.text();
    if (/\.html?$/i.test(file.name)) text = text.replace(/<[^>]+>/g, '\n').replace(/\n{3,}/g, '\n\n');
    setRawText(text);
    e.target.value = '';
  };

  const handleAnalyze = async () => {
    if (!rawText.trim()) {
      setError('还没放聊天记录呢。想先看看效果，点右上角「用示例试试」。');
      return;
    }
    setLoading(true);
    setError('');
    try {
      setResult(await analyze(rawText, mode, apiKey.trim()));
    } catch (err) {
      setResult(null);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-5 py-10 sm:py-14">
      <header className="mb-9">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFF0E6] text-[#C05C33] text-xs font-medium mb-5">
          <Sparkles className="w-3.5 h-3.5" /> 图个乐，别拿这个吵架
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-stone-800 tracking-tight mb-2.5">
          二人互动说明书
        </h1>
        <p className="text-stone-500 text-sm sm:text-[15px] leading-relaxed">
          把聊天记录贴进来，看看你俩平时是怎么相处的。
          <span className="text-stone-400"> 现在只能读微信。</span>
        </p>
      </header>

      {/* 输入区 */}
      <section className="bg-white rounded-3xl p-5 sm:p-7 mb-5 shadow-[0_2px_20px_rgba(180,140,110,0.10)] border border-[#F3E7DC]">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <label className="text-sm font-semibold text-stone-700">
            聊天记录
            <span className="ml-2 font-normal text-xs text-stone-400">微信导出的 txt / csv / json / html，或者直接粘</span>
          </label>
          <div className="flex items-center gap-3 text-xs">
            <label className="flex items-center gap-1 text-[#D2694A] hover:text-[#B5553A] cursor-pointer font-medium">
              <Upload className="w-3.5 h-3.5" /> 选个文件
              <input type="file" accept=".txt,.csv,.json,.html,.htm" onChange={handleFile} className="hidden" />
            </label>
            <button onClick={() => setRawText(DEMO_TEXT)} className="text-stone-400 hover:text-stone-600 underline decoration-dotted">
              用示例试试
            </button>
          </div>
        </div>

        <textarea
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
          placeholder={'一行一句，名字后面加冒号：\n2023-10-15 14:20 张三: 在吗\n14:22 李四: 在的\n\n时间写得糙一点也没事，能认出来就行。'}
          className="w-full h-56 bg-[#FCF8F3] border border-[#EFE1D4] rounded-2xl p-4 text-sm text-stone-700 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#F5A98D]/60 focus:border-[#F5A98D] font-mono resize-y leading-relaxed"
        />

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-xs text-stone-400 mr-1">口吻</span>
          {MODES.map((m) => {
            const Icon = m.icon;
            const active = mode === m.id;
            return (
              <button
                key={m.id}
                onClick={() => setMode(m.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs transition-colors ${
                  active
                    ? 'bg-[#FFEDE3] border-[#F6B396] text-[#B5553A] font-medium'
                    : 'bg-white border-[#EFE1D4] text-stone-500 hover:border-[#E5CDBA] hover:text-stone-700'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {m.label}
                <span className="text-[10px] opacity-60">{m.hint}</span>
              </button>
            );
          })}
        </div>

        <button
          onClick={handleAnalyze}
          disabled={loading}
          className="mt-5 w-full py-3 rounded-full bg-gradient-to-r from-[#F58B6A] to-[#EF6F8D] text-white font-semibold shadow-[0_6px_18px_rgba(239,111,141,0.28)] hover:from-[#F17A55] hover:to-[#E85C7E] disabled:opacity-50 flex items-center justify-center gap-2 transition-all"
        >
          {loading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" /> 正在一条条数…
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" /> 生成说明书
            </>
          )}
        </button>

        {/* 样本建议，紧贴按钮 */}
        <p className="mt-3 text-[11px] text-stone-400 leading-relaxed text-center">
          十几条能看个大概，两百条以上更准
          {roughCount > 0 && <span className="text-stone-500"> · 现在大概 {roughCount} 条</span>}
          <span className="text-stone-300"> · 最多读 6000 条</span>
        </p>

        {error && (
          <div className="mt-4 p-3 rounded-2xl bg-[#FFF1F0] border border-[#F8CDCB] text-[#B5443D] text-xs flex items-start gap-2 leading-relaxed">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            {error}
          </div>
        )}
      </section>

      {/* 隐私承诺 */}
      <div className="flex items-start gap-2 px-2 mb-10 text-[11px] text-stone-400 leading-relaxed">
        <ShieldCheck className="w-3.5 h-3.5 text-[#5FA88E] flex-shrink-0 mt-0.5" />
        <span>
          聊天记录只在你的浏览器里处理，不上传、不保存，关掉页面就没了。
          {apiKey && ' 你填的 Key 也一样，只活在当前页面里。'}
        </span>
      </div>

      {/* 结果 */}
      {result && (
        <div className="space-y-5">
          <section className="relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-[#FFF6EC] via-[#FFF1F3] to-[#F3F8F6] border border-[#F5E6D8]">
            <div className="absolute -top-6 right-3 font-mono font-black text-8xl text-[#E8B9A0]/25 select-none pointer-events-none">
              {result.l2_scores.relationship_type.code}
            </div>
            <div className="relative z-10">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="px-2 py-0.5 bg-white/80 border border-[#F0D5C2] text-[#B5553A] text-[11px] font-mono rounded-md">
                  {result.l2_scores.relationship_type.code}
                </span>
                <span className="text-[11px] text-stone-400">
                  {result.sample_info.total_messages} 条 · 置信度 {result.sample_info.confidence_level}
                  {result.sample_info.truncated && ' · 只算了最近 6000 条'}
                </span>
                {result.narrative.source === 'llm' && (
                  <span className="text-[11px] text-[#9E7BB5]">模型润色过</span>
                )}
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-800 mb-2">
                {result.l2_scores.relationship_type.name}
              </h2>
              <p className="text-[15px] text-[#8C6248] mb-5 leading-relaxed">
                「{result.l2_scores.relationship_type.tagline}」
              </p>

              <div className="p-4 sm:p-5 rounded-2xl bg-white/75 border border-[#F2E3D6] text-sm text-stone-600 leading-relaxed space-y-2">
                <p className="text-stone-800 font-medium">{result.narrative.overview_comment}</p>
                <p>{result.narrative.detailed_analysis}</p>
              </div>

              {result.narrative.warning && (
                <p className="mt-2 text-[11px] text-[#B58A3E]">{result.narrative.warning}</p>
              )}

              <div className="mt-4 grid sm:grid-cols-2 gap-2.5">
                {result.narrative.action_hack?.map((h, i) => (
                  <div key={i} className="p-3 rounded-2xl bg-white/70 border border-[#F0DCC9] text-xs text-[#8A6249] leading-relaxed">
                    {h}
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="bg-white rounded-3xl p-6 shadow-[0_2px_20px_rgba(180,140,110,0.08)] border border-[#F3E7DC]">
            <h3 className="text-sm font-bold text-stone-700 mb-5">三条刻度</h3>
            <div className="space-y-5">
              {Object.entries(result.l2_scores.axes).map(([key, axis]) => (
                <div key={key}>
                  <div className="flex justify-between text-[11px] mb-1.5">
                    <span className="text-[#D2694A] font-medium">{axis.left} {axis.score_left}%</span>
                    <span className="text-stone-400">{axis.label}</span>
                    <span className="text-[#6A9E8E] font-medium">{axis.score_right}% {axis.right}</span>
                  </div>
                  <div className="h-2 w-full bg-[#F7EFE7] rounded-full overflow-hidden flex">
                    <div className="h-full bg-[#F58B6A]" style={{ width: `${axis.score_left}%` }} />
                    <div className="h-full bg-[#7FB3A3]" style={{ width: `${axis.score_right}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="grid sm:grid-cols-2 gap-5">
            {Object.entries(result.l2_scores.mbti_profiles).map(([person, p]) => (
              <div key={person} className="bg-white rounded-3xl p-5 shadow-[0_2px_20px_rgba(180,140,110,0.08)] border border-[#F3E7DC]">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-xs font-semibold text-stone-600">{person}</span>
                  <span className="px-2 py-0.5 bg-[#F1EDFA] border border-[#DDD4F0] text-[#7B62A8] text-xs font-mono rounded-md">
                    {p.code}
                  </span>
                </div>
                <div className="space-y-2.5 mb-4">
                  {p.dimensions.map((d, i) => (
                    <div key={i}>
                      <div className="flex justify-between text-[11px] text-stone-400 mb-1">
                        <span>{d.trait}</span>
                        <span className="font-mono text-stone-600">{d.code} {d.score}%</span>
                      </div>
                      <div className="h-1 w-full bg-[#F7EFE7] rounded-full overflow-hidden">
                        <div className="h-full bg-[#F0A98D]" style={{ width: `${d.score}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {p.cognitive_stack.map((f, i) => (
                    <span key={i} className="px-2 py-0.5 bg-[#FCF8F3] border border-[#EFE1D4] rounded text-[10px] text-stone-500 font-mono">
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </section>

          <section className="bg-white rounded-3xl p-6 shadow-[0_2px_20px_rgba(180,140,110,0.08)] border border-[#F3E7DC]">
            <h3 className="text-sm font-bold text-stone-700 mb-3">你们的固定流程</h3>
            <p className="p-3.5 rounded-2xl bg-[#FFFAF4] border border-[#F2E3D6] text-xs text-[#8A6249] mb-5 leading-relaxed">
              {result.l2_scores.relationship_type.loop}
            </p>
            {result.l1_features.quotes_highlights?.length > 0 && (
              <>
                <h4 className="text-[11px] font-semibold text-stone-400 mb-2">顺手截了几句</h4>
                <div className="grid sm:grid-cols-2 gap-2">
                  {result.l1_features.quotes_highlights.map((q, i) => (
                    <div key={i} className="p-2.5 rounded-xl bg-[#FCF8F3] border border-[#F0E3D6] text-xs">
                      <div className="flex justify-between text-[10px] text-stone-400 mb-1">
                        <span className="text-stone-600">{q.sender}</span>
                        <span>
                          {q.type === 'criticism' ? '开火' : q.type === 'repair' ? '递台阶' : '防守'}
                        </span>
                      </div>
                      <p className="text-stone-500 leading-relaxed">「{q.text}」</p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </section>

          {result.narrative.mbti_narrative && (
            <p className="text-xs text-stone-500 leading-relaxed px-2">{result.narrative.mbti_narrative}</p>
          )}
        </div>
      )}

      {/* 分析原则 + 示例模板 */}
      <footer className="mt-16 pt-8 border-t border-[#F0E3D6] space-y-9">
        <div>
          <h2 className="text-xs font-bold text-stone-500 tracking-wider mb-4">这份报告是怎么来的</h2>
          <ul className="grid sm:grid-cols-2 gap-x-8 gap-y-4">
            {PRINCIPLES.map(([title, body]) => (
              <li key={title}>
                <p className="text-xs font-semibold text-stone-600 mb-1">{title}</p>
                <p className="text-[11px] text-stone-400 leading-relaxed">{body}</p>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="text-xs font-bold text-stone-500 tracking-wider mb-3">最后长这样</h2>
          <pre className="bg-white border border-[#F0E3D6] rounded-2xl p-4 text-[11px] leading-relaxed text-stone-500 overflow-x-auto font-mono">{`代号  SRE
名字  废话合唱团
一句话  一句废话都能接住，还能接出第二句。

刻度  节奏对称度  S 82% ──── P 18%
      关系修复力  R 64% ──── F 36%
      表达通道    E 71% ──── T 29%

两人  张三 ENFP  ·  李四 INFP
流程  抛梗 → 接住 → 加一句 → 停不下来
建议  ……`}</pre>
        </div>

        <details className="group">
          <summary className="flex items-center gap-1.5 text-[11px] text-stone-400 cursor-pointer select-none hover:text-stone-600">
            <ChevronDown className="w-3.5 h-3.5 group-open:rotate-180 transition-transform" />
            嫌本地模板太规矩？可以填自己的 API Key
          </summary>
          <div className="mt-3 space-y-2">
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-…（只存在当前页面，刷新就没了）"
              className="w-full bg-[#FCF8F3] border border-[#EFE1D4] rounded-xl px-3 py-2 text-xs text-stone-700 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#F5A98D]/50 font-mono"
            />
            <p className="text-[10px] text-stone-400 leading-relaxed">
              不填也能用，本地模板照样出报告。填了只会重写叙述那几段，代号和数字不会变。
            </p>
          </div>
        </details>

        <p className="text-[10px] text-stone-400 leading-relaxed">
          现在只能读微信聊天记录。QQ、短信、钉钉还在排队。
        </p>
      </footer>
    </div>
  );
}
