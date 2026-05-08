from quart import Quart, jsonify
from bidding_workflow import BiddingWorkflow
import logging
from config import Config
import json

app = Quart(__name__)
logger = logging.getLogger(__name__)

@app.route('/generate_outline', methods=['POST'])
async def generate_outline():
    async with BiddingWorkflow() as workflow:  # 使用异步上下文管理器
        try:
            logger.info("Starting outline generation")
            
            # 加载输入文件
            logger.info("Loading input files")
            workflow.load_input_files()
            
            # 生成大纲
            logger.info("Generating outline")
            outline_json = await workflow.generate_outline()
            if not outline_json:
                logger.error("Failed to generate outline")
                return jsonify({"status": "error", "message": "Failed to generate outline"}), 500
                
            logger.info("Successfully generated outline")
            
            # 解析大纲
            logger.info("Parsing outline JSON")
            workflow.outline = workflow.parse_outline_json(outline_json)
            
            # 保存大纲
            logger.info("Saving outline")
            workflow.save_outline()
            
            logger.info("Outline generation completed successfully")
            return jsonify({
                "status": "success",
                "outline": workflow.outline.to_dict()
            })
        except Exception as e:
            logger.error(f"Error in generate_outline: {str(e)}", exc_info=True)
            return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/generate_content', methods=['POST'])
async def generate_content():
    workflow = BiddingWorkflow()
    try:
        # 加载输入文件
        workflow.load_input_files()
        
        # 加载已保存的大纲
        with open(Config.OUTLINE_DIR / 'outline.json', 'r', encoding='utf-8') as f:
            outline_dict = json.load(f)
            workflow.outline = workflow.parse_outline_json(outline_dict)
        
        success = await workflow.generate_full_content_async()
        if success:
            return jsonify({"status": "success"})
        else:
            return jsonify({"status": "error", "message": "Content generation failed"}), 500
    except Exception as e:
        logger.error(f"Error in generate_content: {str(e)}", exc_info=True)
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        await workflow.llm_client.close()

@app.route('/generate_document', methods=['POST'])
async def generate_document():
    workflow = BiddingWorkflow()
    try:
        # 加载输入文件
        workflow.load_input_files()
        
        # 加载大纲
        with open(Config.OUTLINE_DIR / 'outline.json', 'r', encoding='utf-8') as f:
            outline_dict = json.load(f)
            workflow.outline = workflow.parse_outline_json(outline_dict)
        
        # 生成完整内容
        success = await workflow.generate_full_content_async()
        if not success:
            return jsonify({"status": "error", "message": "Failed to generate content"}), 500
        
        return jsonify({
            "status": "success",
            "message": "Document generated successfully"
        })
        
    except Exception as e:
        logger.error(f"Error generating document: {e}", exc_info=True)
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        await workflow.llm_client.close()

if __name__ == '__main__':
    app.run(debug=True, port=5000) 