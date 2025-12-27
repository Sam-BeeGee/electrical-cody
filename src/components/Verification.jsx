import React, { useState, useEffect } from 'react';

const Verification = ({ onVerify }) => {
    const [num1, setNum1] = useState(0);
    const [num2, setNum2] = useState(0);
    const [answer, setAnswer] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        generateProblem();
    }, []);

    const generateProblem = () => {
        setNum1(Math.floor(Math.random() * 10) + 1);
        setNum2(Math.floor(Math.random() * 10) + 1);
        setAnswer('');
        setError('');
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (parseInt(answer) === num1 + num2) {
            onVerify();
        } else {
            setError('Incorrect answer. Please try again.');
            generateProblem();
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 border border-gray-100">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800">Human Verification</h2>
                    <p className="text-gray-500 mt-2">Please solve this simple math problem to continue.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 text-center">
                        <span className="text-3xl font-mono font-semibold text-gray-700">
                            {num1} + {num2} = ?
                        </span>
                    </div>

                    <div>
                        <input
                            type="number"
                            value={answer}
                            onChange={(e) => setAnswer(e.target.value)}
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors text-center text-lg"
                            placeholder="Enter the result"
                            required
                        />
                    </div>

                    {error && (
                        <div className="text-red-500 text-sm text-center bg-red-50 p-2 rounded-lg">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors focus:ring-4 focus:ring-green-200"
                    >
                        Verify
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Verification;
