from flask import Flask, request, jsonify
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
from keybert import KeyBERT
import jieba
# 初始化模型（默认使用 MiniLM，支持中文）
kw_model = KeyBERT(model='paraphrase-multilingual-MiniLM-L12-v2')
app = Flask(__name__)
model = SentenceTransformer('paraphrase-MiniLM-L6-v2')
# 输入文本（可以是中文）
def extract(doc) :
    doc_cut = " ".join(jieba.cut(doc))
    # 提取关键词（支持 top_n 控制数量）
    keywords = kw_model.extract_keywords(
        doc_cut,
        keyphrase_ngram_range=(1, 2),
        stop_words=None,
        use_mmr=True,
        diversity=0.7,
        top_n=1
    )
    if keywords:
        return [keywords[0][0]] 
    return []

def compare(tags, input):
    input_tags = extract(input)

    all_words = tags + input_tags
    all_vectors = model.encode(all_words)

    tag_vectors = all_vectors[:len(tags)]
    input_vectors = all_vectors[len(tags):]

    cos_sim = cosine_similarity(tag_vectors, input_vectors)

    result = []
    for i, tag in enumerate(tags):
        total_sim = sum(cos_sim[i])
        result.append((total_sim, tag))

    result.sort(reverse=True)
    return [x[1] for x in result]

def findNew(tags, input):
    input_tags = extract(input)

    all_words = tags + input_tags
    all_vectors = model.encode(all_words)

    tag_vectors = all_vectors[:len(tags)]
    input_vectors = all_vectors[len(tags):]

    cos_sim = cosine_similarity(input_vectors, tag_vectors)

    result = []
    for i, tag in enumerate(input_tags):
        total_sim = sum(cos_sim[i])
        if total_sim/len(cos_sim[i]) < 0.5 :
            for j in tag.split():
                if(not j in result) :
                    result.append(j)

    return result


@app.route('/compare', methods=['POST'])
def calculate_similarity():
    # 获取请求的 JSON 数据
    data = request.get_json()

    # 从请求中提取文本
    tags = data.get('tags') or []
    input = data.get('input') or ""

    res = compare(tags, input)
    
    return jsonify({"tags": res})


@app.route('/extract', methods=['POST'])
def extract_tags():
    data = request.get_json()

    tags = data.get('tags')
    input = data.get('input')

    res = findNew(tags, input)
    return jsonify({"tags" : res})
# 启动 Flask 服务
if __name__ == '__main__':
    app.run(debug=True, host='127.0.0.1', port=5000)
