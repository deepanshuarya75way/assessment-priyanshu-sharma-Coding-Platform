import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import Editor from '@monaco-editor/react';
import { useParams } from 'react-router';
import { useDispatch, useSelector } from 'react-redux';
import axiosClient from "../Utils/axiosClient"
import SubmissionHistory from "../components/Editor/SubmissionHistory"
import ChatAi from '../components/Editor/ChatAi';
import Editorial from '../components/Editor/Editorial';
import {
  setCurrentProblem,
  updateCode,
  setSelectedLanguage,
  setActiveLeftTab,
  setActiveRightTab
} from '../slices/currentProblemSlice';
import ProblemDiscussion from '../components/Editor/ProblemDiscussion';
import LivePreview from '../components/Editor/LivePreview';

const langMap = {
  cpp: 'C++',
  java: 'Java',
  javascript: 'JavaScript'
};

const ProblemPage = () => {
  const dispatch = useDispatch();
  const { problem, code, selectedLanguage, activeLeftTab, activeRightTab } = useSelector((state) => state.currentProblem);

  const [loading, setLoading] = useState(false);
  const [runResult, setRunResult] = useState(null);
  const [submitResult, setSubmitResult] = useState(null);
  const editorRef = useRef(null);
  let { problemId } = useParams();

  const { handleSubmit } = useForm();

  useEffect(() => {
    const fetchProblem = async () => {
      setLoading(true);
      try {
        const response = await axiosClient.get(`/problem/problemById/${problemId}`);
        const startCode = response.data.startCode || [];
        const initialCodeObj = startCode.find(sc => sc.language === langMap[selectedLanguage]);
        const initialCode = initialCodeObj?.initialCode || '// Start coding here';

        dispatch(setCurrentProblem({
          problem: response.data,
          code: initialCode
        }));
      } catch (error) {
        console.error('Error fetching problem:', error);
      } finally {
        setLoading(false);
      }
    };

    if (problemId) {
      fetchProblem();
    }
  }, [problemId]);

  const handleEditorChange = (value) => {
    dispatch(updateCode(value || ''));
  };

  const handleEditorDidMount = (editor) => {
    editorRef.current = editor;
  };

  const handleLanguageChange = (language) => {
    dispatch(setSelectedLanguage(language));
  };

  // Fixed function names - different from Redux actions
  const handleLeftTabChange = (tab) => {
    dispatch(setActiveLeftTab(tab));
  };

  const handleRightTabChange = (tab) => {
    dispatch(setActiveRightTab(tab));
  };

  const handleRun = async () => {
    if (!code.trim()) {
      setRunResult({
        success: false,
        error: 'Code cannot be empty'
      });
      handleRightTabChange('testcase');
      return;
    }

    setLoading(true);
    setRunResult(null);

    try {
      const response = await axiosClient.post(`/submission/run/${problemId}`, {
        code,
        language: selectedLanguage
      });

      setRunResult(response.data);
      handleRightTabChange('testcase');
    } catch (error) {
      console.error('Error running code:', error);
      setRunResult({
        success: false,
        error: error.response?.data?.message || 'Internal server error'
      });
      handleRightTabChange('testcase');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitCode = async () => {
    if (!code.trim()) {
      setSubmitResult({
        accepted: false,
        error: 'Code cannot be empty'
      });
      handleRightTabChange('result');
      return;
    }

    setLoading(true);
    setSubmitResult(null);

    try {
      const response = await axiosClient.post(`/submission/submit/${problemId}`, {
        code: code,
        language: selectedLanguage
      });

      setSubmitResult(response.data);
      handleRightTabChange('result');
    } catch (error) {
      console.error('Error submitting code:', error);
      setSubmitResult({
        accepted: false,
        error: error.response?.data?.message || 'Submission failed'
      });
      handleRightTabChange('result');
    } finally {
      setLoading(false);
    }
  };

  const getLanguageForMonaco = (lang) => {
    switch (lang) {
      case 'javascript': return 'javascript';
      case 'java': return 'java';
      case 'cpp': return 'cpp';
      default: return 'javascript';
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'easy': return 'text-green-500';
      case 'medium': return 'text-yellow-500';
      case 'hard': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  if (loading && !problem) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (!problem && !loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-error">Problem not found</div>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-gradient-to-br from-purple-900 to-black">
      {/* Left Panel */}
      <div className="w-1/2 flex flex-col border-r border-purple-500/30">
        {/* Left Tabs */}
        <div className="tabs tabs-bordered bg-black/50 px-4 border-b border-purple-500/30">
          <button

            className={`tab ${activeLeftTab === 'description' ? 'tab-active text-purple-400' : 'text-gray-400'} hover:text-purple-300 text-xl`}
            onClick={() => handleLeftTabChange('description')}
          >
            Description
          </button>
          <button
            className={`tab ${activeLeftTab === 'editorial' ? 'tab-active text-purple-400' : 'text-gray-400'} hover:text-purple-300 text-xl`}
            onClick={() => handleLeftTabChange('editorial')}
          >
            Editorial
          </button>
          <button
            className={`tab ${activeLeftTab === 'solutions' ? 'tab-active text-purple-400' : 'text-gray-400'} hover:text-purple-300 text-xl`}
            onClick={() => handleLeftTabChange('solutions')}
          >
            Solutions
          </button>
          <button
            className={`tab ${activeLeftTab === 'submissions' ? 'tab-active text-purple-400' : 'text-gray-400'} hover:text-purple-300 text-xl`}
            onClick={() => handleLeftTabChange('submissions')}
          >
            Submissions
          </button>
          <button
            className={`tab ${activeLeftTab === 'chatAI' ? 'tab-active text-purple-400' : 'text-gray-400'} hover:text-purple-300 text-xl`}
            onClick={() => handleLeftTabChange('chatAI')}
          >
            ChatAI
          </button>


          <button
            className={`tab ${activeLeftTab === 'discussion' ? 'tab-active text-purple-400' : 'text-gray-400'} hover:text-purple-300 text-xl`}
            onClick={() => handleLeftTabChange('discussion')}
          >
            Discussion
          </button>

          {/* // Add to your content section */}
          {activeLeftTab === 'discussion' && (
            <div className="h-full overflow-y-auto">
              <ProblemDiscussion />
            </div>
          )}
        </div>

        {/* Left Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-black/30">
          {problem && (
            <>
              {activeLeftTab === 'description' && (
                <div>
                  <div className="flex items-center gap-4 mb-6">
                    <h1 className="text-2xl font-bold text-white">{problem.title}</h1>
                    <div className={`badge ${getDifficultyColor(problem.difficulty)} border-0 text-white`}>
                      {problem.difficulty?.charAt(0).toUpperCase() + problem.difficulty?.slice(1)}
                    </div>
                    <div className="badge bg-purple-500/20 text-purple-300 border-purple-500">
                      {problem.tags}
                    </div>
                  </div>

                  <div className="prose max-w-none">
                    <div className="text-gray-300 whitespace-pre-wrap text-sm leading-relaxed">
                      {problem.description}
                    </div>
                  </div>

                  <div className="mt-8">
                    <h3 className="text-lg font-semibold mb-4 text-white">Examples:</h3>
                    <div className="space-y-4">
                      {(problem.visibleTestCases || []).map((example, index) => (
                        <div key={index} className="bg-black/50 border border-purple-500/30 p-4 rounded-lg">
                          <h4 className="font-semibold mb-2 text-purple-300">Example {index + 1}:</h4>
                          <div className="space-y-2 text-sm font-mono text-gray-300">
                            <div><strong className="text-white">Input:</strong> {example.input}</div>
                            <div><strong className="text-white">Output:</strong> {example.output}</div>
                            {example.explanation && (
                              <div><strong className="text-white">Explanation:</strong> {example.explanation}</div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeLeftTab === 'editorial' && (
                <div className="max-w-none space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-white">
                      🎥 Editorial Explanation
                    </h2>
                    <span className="badge bg-purple-500/20 text-purple-300 border-purple-500">
                      Video Guide
                    </span>
                  </div>

                  <div className="bg-black/50 border border-purple-500/30 rounded-2xl p-4">
                    <div className="rounded-xl overflow-hidden border border-purple-500/30">
                      <Editorial
                        secureUrl={problem?.secureUrl}
                        thumbnailUrl={problem?.thumbnailUrl}
                        duration={problem?.duration}
                      />
                    </div>
                  </div>

                  <div className="bg-black/50 border border-purple-500/30 rounded-xl p-4">
                    <p className="text-sm text-purple-300 leading-relaxed">
                      This editorial provides a complete walkthrough of the problem,
                      explaining the approach, logic, and optimization techniques step-by-step.
                      Watch the video to deeply understand the solution strategy.
                    </p>
                  </div>

                  {!problem?.secureUrl && (
                    <div className="flex items-center justify-center bg-black/50 border border-purple-500/30 rounded-xl p-6 text-purple-400 italic">
                      Editorial content will be available soon 🚧
                    </div>
                  )}
                </div>
              )}

              {activeLeftTab === 'solutions' && (
                <div>
                  <h2 className="text-xl font-bold mb-4 text-white">Solutions</h2>
                  <div className="space-y-6">
                    {(problem.referenceSolution || []).map((solution, index) => (
                      <div key={index} className="border border-purple-500/30 rounded-lg bg-black/50">
                        <div className="bg-purple-500/10 px-4 py-2 rounded-t-lg border-b border-purple-500/30">
                          <h3 className="font-semibold text-purple-300">{problem?.title} - {solution?.language}</h3>
                        </div>
                        <div className="p-4">
                          <pre className="bg-black/70 p-4 rounded text-sm overflow-x-auto text-gray-300 border border-purple-500/20">
                            <code>{solution?.completeCode}</code>
                          </pre>
                        </div>
                      </div>
                    ))}
                    {(!problem.referenceSolution || problem.referenceSolution.length === 0) && (
                      <p className="text-purple-400">Solutions will be available after you solve the problem.</p>
                    )}
                  </div>
                </div>
              )}

              {activeLeftTab === 'submissions' && (
                <div>
                  <h2 className="text-xl font-bold mb-4 text-white">My Submissions</h2>
                  <div className="text-purple-300">
                    <SubmissionHistory problemId={problemId} />
                  </div>
                </div>
              )}

              {activeLeftTab === 'chatAI' && (
                <div className="prose max-w-none">
                  <h2 className="text-xl font-bold mb-4 text-white">CHAT with AI</h2>
                  <div className="text-gray-300 whitespace-pre-wrap text-sm leading-relaxed">
                    <ChatAi problem={problem} />
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Right Panel */}
      <div className="w-1/2 flex flex-col">
        {/* Right Tabs */}

        <div className="tabs tabs-bordered bg-black/50 px-4 border-b border-purple-500/30">
          <div className='tabs tabs-bordered bg-black/50 px-4 border-b border-purple-500'>
            <button className={`tab ${
              activeRightTab==="livePreview"
              ? "tab-active text-purple-400":"text-gray-400"
            } `} onClick={()=>handleRightTabChange("livePreview")}> Live Preview</button>
          </div>
          <button
            className={`tab ${activeRightTab === 'code' ? 'tab-active text-purple-400' : 'text-gray-400'} hover:text-purple-300 text-xl`}
            onClick={() => handleRightTabChange('code')}
          >
            Code
          </button>
          <button
            className={`tab ${activeRightTab === 'testcase' ? 'tab-active text-purple-400' : 'text-gray-400'} hover:text-purple-300 text-xl`}
            onClick={() => handleRightTabChange('testcase')}
          >
            Testcase
          </button>
          <button
            className={`tab ${activeRightTab === 'result' ? 'tab-active text-purple-400' : 'text-gray-400'} hover:text-purple-300 text-xl`}
            onClick={() => handleRightTabChange('result')}
          >
            Result
          </button>
        </div>

        {/* Right Content */}
        <div className="flex-1 flex flex-col bg-black/30">
          {activeRightTab === 'code' && (
            <div className="flex-1 flex flex-col">
              {/* Language Selector */}
              <div className="flex justify-between items-center p-4 border-b border-purple-500/30">
                <div className="flex gap-2">
                  {['javascript', 'java', 'cpp'].map((lang) => (
                    <button
                      key={lang}
                      className={`btn btn-sm ${selectedLanguage === lang ? 'bg-purple-600 border-purple-600 text-white hover:bg-purple-700' : 'bg-black/50 text-gray-400 border-purple-500/30 hover:bg-purple-500/20 hover:text-white'}`}
                      onClick={() => handleLanguageChange(lang)}
                    >
                      {langMap[lang] || lang}
                    </button>
                  ))}
                </div>
              </div>

              {/* Monaco Editor */}
              <div className="flex-1">
                <Editor
                  height="100%"
                  language={getLanguageForMonaco(selectedLanguage)}
                  value={code}
                  onChange={handleEditorChange}
                  onMount={handleEditorDidMount}
                  theme="vs-dark"
                  options={{
                    fontSize: 14,
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    tabSize: 2,
                    insertSpaces: true,
                    wordWrap: 'on',
                    lineNumbers: 'on',
                    glyphMargin: false,
                    folding: true,
                    lineDecorationsWidth: 10,
                    lineNumbersMinChars: 3,
                    renderLineHighlight: 'line',
                    selectOnLineNumbers: true,
                    roundedSelection: false,
                    readOnly: false,
                    cursorStyle: 'line',
                    mouseWheelZoom: true,
                  }}
                />
              </div>

              {/* Action Buttons */}
              <div className="p-4 border-t border-purple-500/30 flex justify-between">
                <div className="flex gap-2">
                  <button
                    className="btn btn-sm bg-black/50 text-gray-400 border-purple-500/30 hover:bg-purple-500/20 hover:text-white"
                    onClick={() => handleRightTabChange('testcase')}
                  >
                    Console
                  </button>
                </div>
                <div className="flex gap-2">
                  <button
                    className={`btn btn-outline btn-sm border-purple-500 text-purple-400 hover:bg-purple-600 hover:text-white ${loading ? 'loading' : ''}`}
                    onClick={handleRun}
                    disabled={loading}
                  >
                    Run
                  </button>
                  <button
                    className={`btn bg-purple-600 border-purple-600 text-white hover:bg-purple-700 btn-sm ${loading ? 'loading' : ''}`}
                    onClick={handleSubmitCode}
                    disabled={loading}
                  >
                    Submit
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeRightTab === 'testcase' && (
            <div className="flex-1 p-4 overflow-y-auto">
              <h3 className="font-semibold mb-4 text-white">Test Results</h3>
              {runResult ? (
                <div className={`alert ${runResult.success ? 'bg-green-500/20 border-green-500 text-green-300' : 'bg-red-500/20 border-red-500 text-red-300'} mb-4 border`}>
                  <div>
                    {runResult.success ? (
                      <div>
                        <h4 className="font-bold">✅ All test cases passed!</h4>
                        <p className="text-sm mt-2">Runtime: {runResult.runtime || 'N/A'} sec</p>
                        <p className="text-sm">Memory: {runResult.memory || 'N/A'} KB</p>

                        <div className="mt-4 space-y-2">
                          {(runResult.testCases || []).map((tc, i) => (
                            <div key={i} className="bg-black/50 border border-purple-500/30 p-3 rounded text-xs">
                              <div className="font-mono text-gray-300">
                                <div><strong className="text-white">Input:</strong> {tc.stdin}</div>
                                <div><strong className="text-white">Expected:</strong> {tc.expected_output}</div>
                                <div><strong className="text-white">Output:</strong> {tc.stdout}</div>
                                <div className={'text-green-400'}>
                                  {'✓ Passed'}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div>
                        <h4 className="font-bold">❌ {runResult.error || 'Error'}</h4>
                        <div className="mt-4 space-y-2">
                          {(runResult.testCases || []).map((tc, i) => (
                            <div key={i} className="bg-black/50 border border-purple-500/30 p-3 rounded text-xs">
                              <div className="font-mono text-gray-300">
                                <div><strong className="text-white">Input:</strong> {tc.stdin}</div>
                                <div><strong className="text-white">Expected:</strong> {tc.expected_output}</div>
                                <div><strong className="text-white">Output:</strong> {tc.stdout}</div>
                                <div className={tc.status_id === 3 ? 'text-green-400' : 'text-red-400'}>
                                  {tc.status_id === 3 ? '✓ Passed' : '✗ Failed'}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-purple-400">
                  Click "Run" to test your code with the example test cases.
                </div>
              )}
            </div>
          )}

          {activeRightTab === 'result' && (
            <div className="flex-1 p-4 overflow-y-auto">
              <h3 className="font-semibold mb-4 text-white">Submission Result</h3>
              {submitResult ? (
                <div className={`alert ${submitResult.accepted ? 'bg-green-500/20 border-green-500 text-green-300' : 'bg-red-500/20 border-red-500 text-red-300'} border`}>
                  <div>
                    {submitResult.accepted ? (
                      <div>
                        <h4 className="font-bold text-lg">🎉 Accepted</h4>
                        <div className="mt-4 space-y-2">
                          <p>Test Cases Passed: {submitResult.passedTestCases}/{submitResult.totalTestCases}</p>
                          <p>Runtime: {submitResult.runtime || 'N/A'} sec</p>
                          <p>Memory: {submitResult.memory || 'N/A'} KB</p>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <h4 className="font-bold text-lg">❌ {submitResult.error || 'Submission Failed'}</h4>
                        <div className="mt-4 space-y-2">
                          <p>Test Cases Passed: {submitResult.passedTestCases}/{submitResult.totalTestCases}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-purple-400">
                  Click "Submit" to submit your solution for evaluation.
                </div>
              )}
            </div>
          )}

          {activeRightTab==="livePreview" && (
            <div className='flex-1 min-h-0 overflow-hidden'><LivePreview/></div>
          )}

        </div>
      </div>
    </div>
  );
}

export default ProblemPage;